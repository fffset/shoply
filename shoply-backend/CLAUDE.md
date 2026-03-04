# Shoply Backend — Claude Notları

## Stack

- **Framework:** NestJS 10
- **Dil:** TypeScript 5 (`strict: true`, `strictPropertyInitialization: false`)
- **ORM:** TypeORM 0.3 + PostgreSQL
- **Auth:** Passport.js — `passport-local` (login) + `passport-jwt` (korumalı route'lar)
- **Validasyon:** `class-validator` + `class-transformer` (global `ValidationPipe`)
- **Port:** 3001

## Temel Kurallar

### Global Prefix
Tüm route'lar `/api` ile başlar — `main.ts`'te `app.setGlobalPrefix('api')` ile ayarlandı.

### Response Formatı
Her başarılı yanıt `ResponseInterceptor` tarafından sarılır:
```json
{ "success": true, "data": ..., "timestamp": "..." }
```
Her hata `HttpExceptionFilter` tarafından formatlanır:
```json
{ "success": false, "statusCode": 400, "message": "...", "timestamp": "..." }
```

### Auth Akışı
- `POST /api/auth/login` → `LocalAuthGuard` → `LocalStrategy` email/şifreyi bcrypt ile doğrular → controller `authService.login(user)` çağırır → `{ user, accessToken }` döner
- Korumalı route'larda `@UseGuards(JwtAuthGuard)` → `JwtStrategy.validate()` `{ id, email, role }` döner → `@CurrentUser()` ile erişilir
- Admin route'larında ek olarak `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')` kullanılır

### Guard'lar ve Decorator'lar (`src/common/`)
- `JwtAuthGuard` — `AuthGuard('jwt')` extend eder
- `LocalAuthGuard` — `AuthGuard('local')` extend eder, sadece login route'unda kullanılır
- `RolesGuard` — `@Roles(...)` metadata'sını okur, `req.user.role`'ü kontrol eder
- `@CurrentUser()` — `req.user`'ı döndüren param decorator
- `@Roles(...roller)` — `SetMetadata('roles', roller)` ile metadata atar

## Modül Yapısı

```
src/modules/
├── auth/
│   ├── strategies/local.strategy.ts   # email+şifre doğrulama
│   ├── strategies/jwt.strategy.ts     # Bearer token doğrulama
│   ├── dto/register.dto.ts
│   ├── dto/login.dto.ts
│   ├── auth.service.ts                # register, login, getMe
│   ├── auth.controller.ts
│   └── auth.module.ts
├── users/
│   ├── entities/user.entity.ts        # id, email, password, firstName, lastName, role
│   ├── users.service.ts               # findByEmail, findById, create
│   └── users.module.ts
├── categories/
│   ├── entities/category.entity.ts    # id, name, slug
│   ├── dto/create-category.dto.ts
│   ├── categories.service.ts
│   ├── categories.controller.ts
│   └── categories.module.ts
├── products/
│   ├── entities/product.entity.ts     # id, name, description, price, stock, imageUrl, category (eager)
│   ├── dto/create-product.dto.ts
│   ├── dto/update-product.dto.ts      # PartialType(CreateProductDto)
│   ├── products.service.ts            # findAll (QueryBuilder + pagination), findOne, create, update, remove
│   ├── products.controller.ts
│   └── products.module.ts
└── orders/
    ├── entities/order.entity.ts       # id, user, status, totalPrice, items (eager)
    ├── entities/order-item.entity.ts  # id, order, product (eager), quantity, priceAtPurchase
    ├── dto/create-order.dto.ts        # items: [{ productId, quantity }]
    ├── orders.service.ts              # create (transaction), findUserOrders, findOne, cancel, findAll, updateStatus
    ├── orders.controller.ts           # OrdersController (/orders) + AdminOrdersController (/admin/orders)
    └── orders.module.ts
```

## Veritabanı

- **Tür:** PostgreSQL
- **Sync:** `synchronize: true` (geliştirmede tablolar entity'lerden otomatik oluşur)
- **Entity yükleme:** `dist/**/*.entity.js`
- Varsayılan bilgiler `.env`'de: `shoply_user` / `shoply_password` / `shoply_db`

## Önemli Uygulama Detayları

### Sipariş Oluşturma (`orders.service.ts`)
`DataSource.transaction()` kullanılır:
1. Her ürün yüklenir, stok kontrol edilir
2. `product.stock` düşürülür
3. `priceAtPurchase = Number(product.price)` anlık fiyat snapshot'ı alınır
4. `totalPrice` hesaplanır
5. `Order` + `OrderItem[]` atomik olarak kaydedilir

### Şifre Yönetimi
- `bcryptjs` ile hash'lenir (10 round) — `UsersService.create()`'de
- `bcrypt.compare()` ile karşılaştırılır — `LocalStrategy.validate()`'de
- Response'larda hiç dönmez — `AuthService.sanitize()` şifreyi çıkartır

### Ürün Sorgusu
`ProductsService.findAll()` `QueryBuilder` kullanır: büyük/küçük harf duyarsız arama için `ILIKE`, sayfalama için `.skip().take()`. `{ data, total, page, limit }` döner.

## tsconfig Notları
- `experimentalDecorators: true` — NestJS/TypeORM decorator'ları için zorunlu
- `emitDecoratorMetadata: true` — Passport/NestJS DI için zorunlu
- `strictPropertyInitialization: false` — Entity ve DTO property'lerine `!` koymayı önler (NestJS bunları runtime'da doldurur)
