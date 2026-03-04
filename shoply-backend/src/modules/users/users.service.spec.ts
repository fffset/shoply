import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';
import { User } from './entities/user.entity';

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

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@test.com');
      expect(result).toEqual(mockUser);
      expect(usersRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should return null when user is not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const result = await service.findByEmail('none@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);
      const result = await service.findById('user-uuid');
      expect(result).toEqual(mockUser);
      expect(usersRepository.findById).toHaveBeenCalledWith('user-uuid');
    });

    it('should return null when user is not found', async () => {
      usersRepository.findById.mockResolvedValue(null);
      const result = await service.findById('bad-uuid');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should hash the password and save the user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      usersRepository.save.mockResolvedValue({ ...mockUser, password: 'hashed-pw' });

      const data = {
        email: 'test@test.com',
        password: 'plain-pw',
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = await service.create(data);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-pw', 10);
      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-pw' }),
      );
      expect(result.password).toBe('hashed-pw');
    });
  });
});
