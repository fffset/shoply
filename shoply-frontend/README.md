# Shoply Frontend

Next.js 14 frontend for the Shoply e-commerce platform. Uses Tailwind CSS for styling and communicates with the Shoply Backend API.

## Requirements

- Node.js 18+
- Shoply Backend running on `http://localhost:3001`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

> All `/api/*` requests are proxied to `http://localhost:3001/api/*` via Next.js rewrites — no CORS configuration needed in development.

## Scripts

```bash
npm run dev     # Development server
npm run build   # Production build
npm run start   # Run production build
npm run lint    # ESLint
npm run format  # Prettier
```

## Pages

| Route | Description | Auth required |
|-------|-------------|---------------|
| `/` | Product list with search and pagination | — |
| `/products/:id` | Product detail, add to cart | — |
| `/login` | Login form | — |
| `/register` | Registration form | — |
| `/cart` | Cart review and checkout | — (login required to place order) |
| `/admin` | Admin dashboard | Admin |
| `/admin/products` | Product list with edit/delete | Admin |
| `/admin/products/new` | Create new product | Admin |
| `/admin/products/:id` | Edit product | Admin |
| `/admin/orders` | Order management | Admin |

## Project Structure

```
shoply-frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (wraps all pages with providers + Navbar)
│   ├── page.tsx            # Home — product list
│   ├── products/[id]/      # Product detail
│   ├── login/
│   ├── register/
│   ├── cart/
│   └── admin/
│       ├── products/
│       └── orders/
├── components/
│   ├── Navbar.tsx          # Top navigation bar
│   ├── ProductCard.tsx     # Product grid card
│   └── LoadingSpinner.tsx  # Centered spinner
├── context/
│   ├── AuthContext.tsx     # User auth state, login/register/logout
│   └── CartContext.tsx     # Cart state, persisted in localStorage
├── lib/
│   └── api.ts              # Axios instance (auto-attaches JWT, handles 401)
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

## State Management

- **Auth:** `AuthContext` — stores the logged-in user, reads token from `localStorage` on mount, exposes `login()`, `register()`, `logout()`
- **Cart:** `CartContext` — stores cart items in `localStorage`, exposes `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`
- No external state library (no Redux, no Zustand)

## API Communication

All API calls go through `lib/api.ts`:

- `baseURL` is `/api` — proxied to the backend by Next.js
- JWT token is automatically attached from `localStorage` via a request interceptor
- On a `401` response, the token is cleared and the user is redirected to `/login`

## Notes

- Cart is client-side only — no backend cart API. When an order is placed, the frontend sends the cart contents to `POST /api/orders` and the backend validates stock.
- Admin pages redirect to `/` if the current user is not an admin. The real enforcement is in the backend guards.
