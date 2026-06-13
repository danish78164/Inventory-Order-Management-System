# StockFlow — Inventory & Order Management System

A production-ready full-stack application built with **FastAPI**, **React**, and **PostgreSQL**, fully containerized with **Docker**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 · FastAPI · SQLAlchemy |
| Frontend | React 18 · Vite · Tailwind CSS |
| Database | PostgreSQL 16 |
| Container | Docker · Docker Compose |
| Deployment | Render (backend) · Vercel (frontend) |

---

## Features

- **Product Management** — Add, edit, delete products with unique SKU enforcement
- **Customer Management** — Register customers with unique email validation
- **Order Management** — Place orders with automatic stock reduction and validation
- **Inventory Validation** — Orders blocked when stock is insufficient
- **Auto Stock Restore** — Cancelling an order restores product quantities
- **Dashboard** — Real-time stats: total products, customers, orders, low-stock alerts
- **Responsive UI** — Works on desktop and mobile

---

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/stockflow.git
cd stockflow

# 2. Copy env file and configure
cp .env.example .env
# Edit .env and set a secure POSTGRES_PASSWORD

# 3. Start everything
docker compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:8000
# API Docs → http://localhost:8000/docs
```

---

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products/` | List all products |
| POST | `/products/` | Create product |
| GET | `/products/{id}` | Get product by ID |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers/` | List all customers |
| POST | `/customers/` | Create customer |
| GET | `/customers/{id}` | Get customer by ID |
| DELETE | `/customers/{id}` | Delete customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders/` | List all orders |
| POST | `/orders/` | Place new order |
| GET | `/orders/{id}` | Get order details |
| DELETE | `/orders/{id}` | Cancel order (restores stock) |
| GET | `/orders/dashboard/stats` | Dashboard summary |

---

## Business Rules

- Product SKU must be unique across all products
- Customer email must be unique
- Product quantity cannot go below 0
- Orders are rejected if any product has insufficient stock
- Placing an order atomically reduces stock for all items
- Cancelling an order atomically restores stock for all items
- Order total is calculated server-side (cannot be manipulated)

---

## Deployment

### Backend on Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository, select the `backend/` folder
3. Set **Runtime**: Python 3, **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `DATABASE_URL` → your PostgreSQL connection string
6. Add a **PostgreSQL** database on Render, copy the Internal Database URL

### Frontend on Vercel

1. Import your GitHub repository on [vercel.com](https://vercel.com)
2. Set **Root Directory**: `frontend`
3. Set environment variable: `VITE_API_URL` → your Render backend URL
4. Deploy!

### Docker Hub (backend image)

```bash
docker build -t yourusername/stockflow-backend:latest ./backend
docker push yourusername/stockflow-backend:latest
```

---

## Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Set DATABASE_URL to a local PostgreSQL instance
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env       # Set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/inventory_db` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:3000` |
| `VITE_API_URL` | Backend API base URL (build-time) | `http://localhost:8000` |
| `POSTGRES_DB` | Database name | `inventory_db` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | *(required in production)* |

---

## Project Structure

```
stockflow/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app & CORS
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   └── models.py    # Product, Customer, Order, OrderItem
│   │   ├── schemas/
│   │   │   └── schemas.py   # Pydantic request/response models
│   │   └── routes/
│   │       ├── products.py
│   │       ├── customers.py
│   │       └── orders.py    # Includes dashboard stats
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── OrderDetail.jsx
│   │   ├── components/UI/
│   │   │   ├── Layout.jsx   # Sidebar navigation
│   │   │   └── index.jsx    # Button, Input, Modal, Card, etc.
│   │   └── utils/api.js     # Axios API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml
└── .env.example
```
