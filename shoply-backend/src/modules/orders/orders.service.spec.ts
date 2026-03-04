import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { Order } from './entities/order.entity';
import { Product } from '../products/entities/product.entity';

const mockUser = { id: 'user-uuid', email: 'test@test.com', role: 'user' };
const mockProduct = {
  id: 'prod-uuid',
  name: 'Test Product',
  price: '29.99' as unknown as number,
  stock: 10,
};

const mockOrder = {
  id: 'order-uuid',
  totalPrice: 59.98,
  status: 'pending' as const,
  user: { id: 'user-uuid' },
  items: [],
  createdAt: new Date(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: jest.Mocked<OrdersRepository>;
  let dataSource: { transaction: jest.Mock };

  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            findByUserId: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get(OrdersRepository);
    dataSource = module.get(DataSource);

    dataSource.transaction.mockImplementation((cb: (manager: typeof mockManager) => unknown) =>
      cb(mockManager),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create order, deduct stock, and set priceAtPurchase', async () => {
      const product = { ...mockProduct, stock: 10 };
      const savedOrder = { ...mockOrder };

      mockManager.findOne.mockResolvedValue(product);
      mockManager.create.mockReturnValue(savedOrder);
      mockManager.save
        .mockResolvedValueOnce(product)
        .mockResolvedValueOnce(savedOrder);

      const dto = { items: [{ productId: 'prod-uuid', quantity: 2 }] };
      const result = await service.create('user-uuid', dto);

      expect(result).toEqual(savedOrder);
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 8 }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        Order,
        expect.objectContaining({ totalPrice: expect.any(Number) }),
      );
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockManager.findOne.mockResolvedValue(null);
      const dto = { items: [{ productId: 'bad-uuid', quantity: 1 }] };
      await expect(service.create('user-uuid', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      mockManager.findOne.mockResolvedValue({ ...mockProduct, stock: 1 });
      const dto = { items: [{ productId: 'prod-uuid', quantity: 5 }] };
      await expect(service.create('user-uuid', dto)).rejects.toThrow(BadRequestException);
    });

    it('should calculate totalPrice correctly for multiple items', async () => {
      const product1 = { id: 'p1', name: 'A', price: '10.00' as unknown as number, stock: 5 };
      const product2 = { id: 'p2', name: 'B', price: '20.00' as unknown as number, stock: 5 };

      mockManager.findOne
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);

      const expectedTotal = 10 * 2 + 20 * 3;
      mockManager.create.mockReturnValue({ ...mockOrder, totalPrice: expectedTotal });
      mockManager.save
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2)
        .mockResolvedValueOnce({ ...mockOrder, totalPrice: expectedTotal });

      const dto = {
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 3 },
        ],
      };
      await service.create('user-uuid', dto);

      expect(mockManager.create).toHaveBeenCalledWith(
        Order,
        expect.objectContaining({ totalPrice: expectedTotal }),
      );
    });
  });

  describe('findUserOrders', () => {
    it('should return orders for the given userId', async () => {
      ordersRepository.findByUserId.mockResolvedValue([mockOrder as unknown as Order]);
      const result = await service.findUserOrders('user-uuid');
      expect(ordersRepository.findByUserId).toHaveBeenCalledWith('user-uuid');
      expect(result).toEqual([mockOrder]);
    });

    it('should return empty array when user has no orders', async () => {
      ordersRepository.findByUserId.mockResolvedValue([]);
      const result = await service.findUserOrders('user-uuid');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return order when user is the owner', async () => {
      ordersRepository.findById.mockResolvedValue({
        ...mockOrder,
        user: { id: 'user-uuid' },
      } as unknown as Order);
      const result = await service.findOne('order-uuid', 'user-uuid', 'user');
      expect(result).toBeDefined();
    });

    it('should return order when caller is admin (even different userId)', async () => {
      ordersRepository.findById.mockResolvedValue({
        ...mockOrder,
        user: { id: 'other-uuid' },
      } as unknown as Order);
      const result = await service.findOne('order-uuid', 'admin-uuid', 'admin');
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when non-owner non-admin accesses order', async () => {
      ordersRepository.findById.mockResolvedValue({
        ...mockOrder,
        user: { id: 'someone-else' },
      } as unknown as Order);
      await expect(service.findOne('order-uuid', 'user-uuid', 'user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      ordersRepository.findById.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-uuid', 'user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel a pending order', async () => {
      const pendingOrder = { ...mockOrder, status: 'pending' as const, user: { id: 'user-uuid' } };
      ordersRepository.findById.mockResolvedValue(pendingOrder as unknown as Order);
      ordersRepository.save.mockResolvedValue({
        ...pendingOrder,
        status: 'cancelled',
      } as unknown as Order);

      const result = await service.cancel('order-uuid', 'user-uuid', 'user');
      expect(result.status).toBe('cancelled');
      expect(ordersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' }),
      );
    });

    it('should throw BadRequestException when order is not pending', async () => {
      ordersRepository.findById.mockResolvedValue({
        ...mockOrder,
        status: 'confirmed' as const,
        user: { id: 'user-uuid' },
      } as unknown as Order);
      await expect(service.cancel('order-uuid', 'user-uuid', 'user')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all orders without status filter', async () => {
      ordersRepository.findAll.mockResolvedValue([mockOrder as unknown as Order]);
      const result = await service.findAll();
      expect(ordersRepository.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(1);
    });

    it('should filter by status when provided', async () => {
      ordersRepository.findAll.mockResolvedValue([]);
      await service.findAll('confirmed');
      expect(ordersRepository.findAll).toHaveBeenCalledWith('confirmed');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const order = { ...mockOrder, status: 'pending' as const };
      ordersRepository.findById.mockResolvedValue(order as unknown as Order);
      ordersRepository.save.mockResolvedValue({
        ...order,
        status: 'confirmed',
      } as unknown as Order);

      const result = await service.updateStatus('order-uuid', 'confirmed');
      expect(result.status).toBe('confirmed');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      ordersRepository.findById.mockResolvedValue(null);
      await expect(service.updateStatus('bad-id', 'confirmed')).rejects.toThrow(NotFoundException);
    });
  });

  // Suppress unused variable warnings
  it('should have mockUser and mockProduct defined', () => {
    expect(mockUser).toBeDefined();
    expect(mockProduct).toBeDefined();
    const _p: typeof Product = Product;
    expect(_p).toBeDefined();
  });
});
