import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as (app: unknown) => import('supertest').SuperTest<import('supertest').Test>;
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { Product } from './entities/product.entity';

const TEST_SECRET = 'dev-secret'; // matches JwtStrategy's process.env.JWT_SECRET || 'dev-secret'

const mockProduct: Partial<Product> = {
  id: 'prod-uuid',
  name: 'Test Product',
  description: 'A test product',
  price: 29.99,
  stock: 10,
};

describe('Products Integration', () => {
  let app: INestApplication;
  let productsService: jest.Mocked<ProductsService>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: TEST_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [ProductsController],
      providers: [
        JwtStrategy,
        RolesGuard,
        Reflector,
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    productsService = moduleRef.get(ProductsService);
    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return 200 with paginated product list', async () => {
      productsService.findAll.mockResolvedValue({
        data: [mockProduct as Product],
        total: 1,
        page: 1,
        limit: 12,
      });

      const res = await request(app.getHttpServer()).get('/api/products').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });

    it('should pass query params to service', async () => {
      productsService.findAll.mockResolvedValue({ data: [], total: 0, page: 2, limit: 5 });

      await request(app.getHttpServer())
        .get('/api/products?page=2&limit=5&search=shirt&categoryId=cat-uuid')
        .expect(200);

      expect(productsService.findAll).toHaveBeenCalledWith(2, 5, 'cat-uuid', 'shirt');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return 200 with a single product', async () => {
      productsService.findOne.mockResolvedValue(mockProduct as Product);

      const res = await request(app.getHttpServer()).get('/api/products/prod-uuid').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('prod-uuid');
    });
  });

  describe('POST /api/products (admin only)', () => {
    it('should return 401 when no token provided', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'New Product', price: 10, stock: 5 })
        .expect(401);
    });

    it('should return 403 when user role is not admin', async () => {
      const userToken = jwtService.sign({ sub: 'u1', email: 'u@u.com', role: 'user' });

      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'New Product', price: 10, stock: 5 })
        .expect(403);
    });

    it('should return 201 when admin creates a product', async () => {
      const adminToken = jwtService.sign({ sub: 'a1', email: 'a@a.com', role: 'admin' });
      productsService.create.mockResolvedValue(mockProduct as Product);

      const res = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Product', price: 10, stock: 5 })
        .expect(201);

      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/products/:id (admin only)', () => {
    it('should return 403 for non-admin users', async () => {
      const userToken = jwtService.sign({ sub: 'u1', email: 'u@u.com', role: 'user' });

      await request(app.getHttpServer())
        .put('/api/products/prod-uuid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated' })
        .expect(403);
    });

    it('should return 200 when admin updates a product', async () => {
      const adminToken = jwtService.sign({ sub: 'a1', email: 'a@a.com', role: 'admin' });
      productsService.update.mockResolvedValue({ ...mockProduct, name: 'Updated' } as Product);

      const res = await request(app.getHttpServer())
        .put('/api/products/prod-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/products/:id (admin only)', () => {
    it('should return 403 for non-admin users', async () => {
      const userToken = jwtService.sign({ sub: 'u1', email: 'u@u.com', role: 'user' });

      await request(app.getHttpServer())
        .delete('/api/products/prod-uuid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 200 when admin removes a product', async () => {
      const adminToken = jwtService.sign({ sub: 'a1', email: 'a@a.com', role: 'admin' });
      productsService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/api/products/prod-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
