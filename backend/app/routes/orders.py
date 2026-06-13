from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.models import Order, OrderItem, Product, Customer
from app.schemas.schemas import OrderCreate, OrderOut, DashboardStats, ProductOut

router = APIRouter()


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not order.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    # Validate all products and stock before making any changes
    resolved_items = []
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product with ID {item.product_id} not found",
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}",
            )
        resolved_items.append((product, item.quantity))

    # All validations passed — create order
    total_amount = sum(p.price * qty for p, qty in resolved_items)

    db_order = Order(
        customer_id=order.customer_id,
        total_amount=total_amount,
        notes=order.notes,
        status="pending",
    )
    db.add(db_order)
    db.flush()  # Get order ID without committing

    for product, quantity in resolved_items:
        order_item = OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
        )
        db.add(order_item)
        product.quantity -= quantity  # Reduce stock atomically

    db.commit()
    db.refresh(db_order)

    return db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.items).joinedload(OrderItem.product),
    ).filter(Order.id == db_order.id).first()


@router.get("/", response_model=List[OrderOut])
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()

    low_stock = db.query(Product).filter(Product.quantity <= 5).all()

    recent_orders = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock,
        recent_orders=recent_orders,
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Restore stock when cancelling
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity += item.quantity

    db.delete(order)
    db.commit()
