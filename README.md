# Shoply

A full-stack e-commerce application built with NestJS and Next.js.

## Projects

| Project | Tech | Port | Description |
|---------|------|------|-------------|
| [shoply-backend](./shoply-backend) | NestJS + TypeORM + PostgreSQL | 3001 | REST API |
| [shoply-frontend](./shoply-frontend) | Next.js 14 + Tailwind CSS | 3000 | Web app |

## Quick Start

### 1. Start PostgreSQL

```bash
cd shoply-backend
docker-compose up -d
```

### 2. Start everything (single command)

```bash
npm run dev
```

Starts both the backend (port 3001) and frontend (port 3000) in parallel.

> To start them separately, follow the steps below.

### 3. Start the backend (separately)

```bash
cd shoply-backend
npm install
npm run start:dev
```

### 4. Start the frontend (separately)

```bash
cd shoply-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Product listing with search and pagination
- Product detail page
- Shopping cart (persisted in localStorage)
- User registration and login (JWT)
- Order placement with stock validation
- User order history with cancel support
- User profile page
- Admin panel — product, order, and category management

## Architecture

```
shoply/
├── shoply-backend/     # NestJS API
│   ├── src/
│   │   ├── modules/    # auth, users, products, categories, orders
│   │   └── common/     # guards, filters, interceptors, decorators
│   └── docker-compose.yml
└── shoply-frontend/    # Next.js app
    ├── app/            # Pages (App Router)
    ├── components/     # Navbar, ProductCard, LoadingSpinner
    ├── context/        # AuthContext, CartContext
    ├── lib/            # Axios instance
    └── types/          # Shared TypeScript interfaces
```

## Environment Variables

The backend `.env` file is pre-configured for local development:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=shoply_user
DB_PASSWORD=shoply_password
DB_NAME=shoply_db
JWT_SECRET=shoply-super-secret-jwt-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

> Change `JWT_SECRET` before deploying to production.
