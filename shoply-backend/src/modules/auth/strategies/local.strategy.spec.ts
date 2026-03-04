import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

jest.mock('bcryptjs');
import * as bcrypt from 'bcryptjs';

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

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      providers: [
        LocalStrategy,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return the user when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await strategy.validate('test@test.com', 'password');

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(strategy.validate('bad@test.com', 'pw')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(strategy.validate('test@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
