import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as (app: unknown) => import('supertest').SuperTest<import('supertest').Test>;
import { OrdersController, AdminOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { Order } from './entities/order.entity';

const TEST_SECRET = 'dev-secret';

const mockOrder: Partial<Order> = {
  id: 'order-uuid',
  totalPrice: 59.98,
  status: 'pending',
  items: [],
};

describe('Orders Integration', () => {
  let app: INestApplication;
  let ordersService: jest.Mocked<OrdersService>;
  let jwtService: JwtService;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: TEST_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [OrdersController, AdminOrdersController],
      providers: [
        JwtStrategy,
        RolesGuard,
        Reflector,
        {
          provide: OrdersService,
          useValue: {
            create: jest.fn(),
            findUserOrders: jest.fn(),
            findOne: jest.fn(),
            cancel: jest.fn(),
            findAll: jest.fn(),
            updateStatus: jest.fn(),
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

    ordersService = moduleRef.get(OrdersService);
    jwtService = moduleRef.get(JwtService);
    userToken = jwtService.sign({ sub: 'user-uuid', email: 'u@u.com', role: 'user' });
    adminToken = jwtService.sign({ sub: 'admin-uuid', email: 'a@a.com', role: 'admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .send({ items: [{ productId: 'prod-uuid', quantity: 1 }] })
        .expect(401);
    });

    it('should create order and return 201 for authenticated user', async () => {
      ordersService.create.mockResolvedValue(mockOrder as Order);

      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: [{ productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', quantity: 1 }] })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should return 400 on invalid dto (empty items array)', async () => {
      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: [] })
        .expect(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/orders').expect(401);
    });

    it('should return user orders for authenticated user', async () => {
      ordersService.findUserOrders.mockResolvedValue([mockOrder as Order]);

      const res = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('PATCH /api/orders/:id/cancel', () => {
    it('should cancel order for authenticated user', async () => {
      ordersService.cancel.mockResolvedValue({ ...mockOrder, status: 'cancelled' } as Order);

      const res = await request(app.getHttpServer())
        .patch('/api/orders/order-uuid/cancel')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.status).toBe('cancelled');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).patch('/api/orders/order-uuid/cancel').expect(401);
    });
  });

  describe('GET /api/admin/orders', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/admin/orders').expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 200 for admin user', async () => {
      ordersService.findAll.mockResolvedValue([mockOrder as Order]);

      const res = await request(app.getHttpServer())
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('should pass status query param to service', async () => {
      ordersService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/admin/orders?status=confirmed')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(ordersService.findAll).toHaveBeenCalledWith('confirmed');
    });
  });

  describe('PATCH /api/admin/orders/:id/status', () => {
    it('should return 403 for non-admin', async () => {
      await request(app.getHttpServer())
        .patch('/api/admin/orders/order-uuid/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'confirmed' })
        .expect(403);
    });

    it('should update order status as admin', async () => {
      ordersService.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'confirmed',
      } as Order);

      const res = await request(app.getHttpServer())
        .patch('/api/admin/orders/order-uuid/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(res.body.data.status).toBe('confirmed');
    });
  });
});
