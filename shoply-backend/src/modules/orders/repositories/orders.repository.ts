import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {}

  findByUserId(userId: string): Promise<Order[]> {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string, withUser = false): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      ...(withUser && { relations: ['user'] }),
    });
  }

  findAll(status?: string): Promise<Order[]> {
    const where = status ? { status: status as Order['status'] } : {};
    return this.repo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  save(order: Partial<Order>): Promise<Order> {
    return this.repo.save(order as Order);
  }
}
