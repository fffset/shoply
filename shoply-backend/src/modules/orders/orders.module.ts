import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController, AdminOrdersController } from './orders.controller';
import { OrdersRepository } from './repositories/orders.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  providers: [OrdersService, OrdersRepository],
  controllers: [OrdersController, AdminOrdersController],
})
export class OrdersModule {}
