import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as (app: unknown) => import('supertest').SuperTest<import('supertest').Test>;
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';
import { User } from '../users/entities/user.entity';

jest.mock('bcryptjs');
import * as bcrypt from 'bcryptjs';

const TEST_SECRET = 'test-secret';

const mockUser: User = {
  id: 'user-uuid',
  email: 'test@test.com',
  password: 'hashed-pw',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

class MockJwtAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    ctx.switchToHttp().getRequest().user = { id: mockUser.id, role: mockUser.role };
    return true;
  }
}

describe('Auth Integration', () => {
  let app: INestApplication;
  let usersService: jest.Mocked<UsersService>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: TEST_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    usersService = moduleRef.get(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register and return 201 with wrapped response', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'pass123',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.user.email).toBe(mockUser.email);
    });

    it('should return 400 on invalid email (ValidationPipe)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'pass123',
          firstName: 'Jo',
          lastName: 'Do',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 409 when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'pass123',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with token when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'pass123' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return 401 when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 200 with user data', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer anything')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(mockUser.email);
    });
  });
});
