import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

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

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@test.com',
      password: 'pass123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register user and return sanitized user + accessToken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should call jwtService.sign with correct payload', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('login', () => {
    it('should return sanitized user and accessToken', async () => {
      const result = await service.login(mockUser);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(mockUser.email);
    });
  });

  describe('getMe', () => {
    it('should return sanitized user when found', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.getMe('user-uuid');

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('password');
      expect((result as { email: string }).email).toBe(mockUser.email);
    });

    it('should return null when user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      const result = await service.getMe('bad-uuid');

      expect(result).toBeNull();
    });
  });
});
