import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      let totalPrice = 0;
      const orderItems: Partial<OrderItem>[] = [];

      for (const item of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}"`,
          );
        }

        product.stock -= item.quantity;
        await manager.save(product);

        const priceAtPurchase = Number(product.price);
        totalPrice += priceAtPurchase * item.quantity;
        orderItems.push({ product, quantity: item.quantity, priceAtPurchase });
      }

      const order = manager.create(Order, {
        user: { id: userId } as never,
        totalPrice,
        items: orderItems as OrderItem[],
      });
      return manager.save(order);
    });
  }

  findUserOrders(userId: string): Promise<Order[]> {
    return this.ordersRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string, role: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (role !== 'admin' && order.user.id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async cancel(id: string, userId: string, role: string): Promise<Order> {
    const order = await this.findOne(id, userId, role);
    if (order.status !== 'pending') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    order.status = 'cancelled';
    return this.ordersRepo.save(order);
  }

  findAll(status?: string): Promise<Order[]> {
    const where = status ? { status: status as Order['status'] } : {};
    return this.ordersRepo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: string,
    status: 'confirmed' | 'cancelled',
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    order.status = status;
    return this.ordersRepo.save(order);
  }
}
