# Shoply Frontend — Claude Notes

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (`strict: true`)
- **Styling:** Tailwind CSS 3 — utility classes only, no component library
- **HTTP:** Axios — single instance in `lib/api.ts`
- **State:** React Context — `AuthContext` and `CartContext` only
- **Port:** 3000

## Key Conventions

### Keep code simple
The user is not experienced with frontend. Prefer:
- `useState` + `useEffect` for data fetching (no React Query, no SWR)
- Inline Tailwind classes (no CSS modules, no styled-components)
- Flat component structure — no deep abstractions
- Turkish UI text (labels, buttons, error messages)

### API calls
Always use the axios instance from `lib/api.ts`, never raw `fetch` or a new `axios.create()`.

```ts
import api from '@/lib/api';

const res = await api.get('/products');
const products = res.data.data; // unwrap the { success, data } envelope
```

### Auth
- Token stored in `localStorage` under key `'token'`
- `AuthContext` loads the user on mount by calling `GET /api/auth/me`
- Use `useAuth()` hook to access `{ user, loading, login, register, logout }`
- Admin check: `user?.role === 'admin'`

### Cart
- Stored in `localStorage` under key `'cart'` as JSON
- Use `useCart()` hook to access `{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }`
- Cart is never sent to the backend — only used when placing an order

### Error handling in forms
Catch axios errors and display inline:
```ts
} catch (err: unknown) {
  const msg = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message || 'Bir hata oluştu';
  setError(msg);
}
```

## File Map

| File | Purpose |
|------|---------|
| `lib/api.ts` | Axios instance — token interceptor + 401 redirect |
| `types/index.ts` | All shared interfaces: User, Product, Category, Order, CartItem, ApiResponse, PaginatedResponse |
| `context/AuthContext.tsx` | Auth state provider — exported: `AuthProvider`, `useAuth` |
| `context/CartContext.tsx` | Cart state provider — exported: `CartProvider`, `useCart` |
| `app/layout.tsx` | Root layout — wraps everything in `AuthProvider` > `CartProvider` > `Navbar` |
| `components/Navbar.tsx` | Shows Login/Register when logged out, name + Logout + Cart when logged in, Admin link for admins |
| `components/ProductCard.tsx` | Product grid card — image, name, category, price, link to detail |
| `components/LoadingSpinner.tsx` | Centered `animate-spin` div |

## API Response Shape

The backend wraps all responses:
```json
{ "success": true, "data": <actual payload>, "timestamp": "..." }
```

Always access `res.data.data` for the payload. Paginated list responses:
```json
{ "data": [...], "total": 42, "page": 1, "limit": 12 }
```
Access as `res.data.data.data` (outer `.data` = envelope, inner `.data` = array).

## Next.js Proxy

`next.config.js` rewrites `/api/*` → `http://localhost:3001/api/*`.
This means all `api.get('/products')` calls go to the backend without CORS issues.
In production, replace with a real reverse proxy.

## 'use client' Directive

Every page and component that uses React hooks (`useState`, `useEffect`, `useContext`, etc.) must have `'use client'` at the top. Only `app/layout.tsx` and pure server components can omit it.
