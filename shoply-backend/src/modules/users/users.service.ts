import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async create(data: CreateUserData): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.usersRepository.save({ ...data, password: hashedPassword });
  }
}
