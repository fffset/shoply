# Shoply Backend

NestJS REST API for the Shoply e-commerce platform. Uses PostgreSQL with TypeORM and JWT-based authentication.

## Requirements

- Node.js 18+
- PostgreSQL 14+ (or Docker)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

A `.env` file is already included with default development values:

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

### 3. Start PostgreSQL

Using Docker (recommended):

```bash
docker-compose up -d
```

Or configure your own PostgreSQL instance using the values above.

### 4. Run the development server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`. Tables are created automatically via TypeORM `synchronize: true`.

## Scripts

```bash
npm run start:dev   # Development with hot reload
npm run build       # Compile TypeScript
npm run start:prod  # Run compiled build
npm run lint        # ESLint
npm run format      # Prettier
```

## API Endpoints

All routes are prefixed with `/api`. Successful responses are wrapped in `{ success: true, data, timestamp }`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user |

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | — | List all categories |
| POST | `/api/categories` | Admin | Create a category |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | — | List products (paginated) |
| GET | `/api/products/:id` | — | Get product detail |
| POST | `/api/products` | Admin | Create a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |

Query params for `GET /api/products`: `page`, `limit`, `categoryId`, `search`

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | JWT | Place an order |
| GET | `/api/orders` | JWT | List own orders |
| GET | `/api/orders/:id` | JWT | Get order detail |
| PATCH | `/api/orders/:id/cancel` | JWT | Cancel an order |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/orders` | Admin | List all orders |
| PATCH | `/api/admin/orders/:id/status` | Admin | Update order status |

## Project Structure

```
src/
├── common/
│   ├── decorators/         # @CurrentUser, @Roles
│   ├── filters/            # HttpExceptionFilter
│   ├── guards/             # JwtAuthGuard, LocalAuthGuard, RolesGuard
│   └── interceptors/       # ResponseInterceptor
├── config/
│   └── database.config.ts
├── modules/
│   ├── auth/               # JWT + Passport strategies, register/login
│   ├── users/              # User entity and service
│   ├── categories/         # Category CRUD
│   ├── products/           # Product CRUD with pagination
│   └── orders/             # Order creation (transactional), status management
├── app.module.ts
└── main.ts
```

## Notes

- `synchronize: true` is enabled in development — no migrations needed
- Cart is managed client-side; the backend only validates stock when an order is placed
- `priceAtPurchase` is snapshotted on each `OrderItem` so order history is never affected by price changes
