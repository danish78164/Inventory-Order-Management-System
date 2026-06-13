from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime


# ─── Product Schemas ──────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    quantity: int
    category: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v):
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("Quantity must be non-negative")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    category: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Quantity must be non-negative")
        return v


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Customer Schemas ─────────────────────────────────────────────────────────

class CustomerBase(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


# ─── Order Schemas ────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Order quantity must be positive")
        return v


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: Optional[ProductOut] = None


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]
    notes: Optional[str] = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    status: str
    total_amount: float
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    customer: Optional[CustomerOut] = None
    items: List[OrderItemOut] = []


# ─── Dashboard Schema ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: List[ProductOut]
    recent_orders: List[OrderOut]
