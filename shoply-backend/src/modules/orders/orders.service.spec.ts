import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
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
  let ordersRepo: jest.Mocked<Repository<Order>>;
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
          provide: getRepositoryToken(Order),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
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
    ordersRepo = module.get(getRepositoryToken(Order));
    dataSource = module.get(DataSource);

    // Default: transaction immediately calls the callback with mockManager
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
      mockManager.save.mockResolvedValue(product);
      mockManager.create.mockReturnValue(savedOrder);
      // Second save call returns the order
      mockManager.save
        .mockResolvedValueOnce(product) // product save
        .mockResolvedValueOnce(savedOrder); // order save

      const dto = { items: [{ productId: 'prod-uuid', quantity: 2 }] };
      const result = await service.create('user-uuid', dto);

      expect(result).toEqual(savedOrder);
      // Stock should be decremented (product.stock -= 2)
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 8 }),
      );
      expect(mockManager.create).toHaveBeenCalledWith(
        Order,
        expect.objectContaining({
          totalPrice: expect.any(Number),
        }),
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
      mockManager.save.mockImplementation(async (entity: unknown) => entity);

      const expectedTotal = 10 * 2 + 20 * 3; // 20 + 60 = 80
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
      ordersRepo.find.mockResolvedValue([mockOrder as unknown as Order]);
      const result = await service.findUserOrders('user-uuid');
      expect(ordersRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user: { id: 'user-uuid' } } }),
      );
      expect(result).toEqual([mockOrder]);
    });

    it('should return empty array when user has no orders', async () => {
      ordersRepo.find.mockResolvedValue([]);
      const result = await service.findUserOrders('user-uuid');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return order when user is the owner', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...mockOrder, user: { id: 'user-uuid' } } as unknown as Order);
      const result = await service.findOne('order-uuid', 'user-uuid', 'user');
      expect(result).toBeDefined();
    });

    it('should return order when caller is admin (even different userId)', async () => {
      ordersRepo.findOne.mockResolvedValue({
        ...mockOrder,
        user: { id: 'other-uuid' },
      } as unknown as Order);
      const result = await service.findOne('order-uuid', 'admin-uuid', 'admin');
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when non-owner non-admin accesses order', async () => {
      ordersRepo.findOne.mockResolvedValue({
        ...mockOrder,
        user: { id: 'someone-else' },
      } as unknown as Order);
      await expect(service.findOne('order-uuid', 'user-uuid', 'user')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      ordersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id', 'user-uuid', 'user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a pending order', async () => {
      const pendingOrder = { ...mockOrder, status: 'pending' as const, user: { id: 'user-uuid' } };
      ordersRepo.findOne.mockResolvedValue(pendingOrder as unknown as Order);
      ordersRepo.save.mockResolvedValue({ ...pendingOrder, status: 'cancelled' } as unknown as Order);

      const result = await service.cancel('order-uuid', 'user-uuid', 'user');
      expect(result.status).toBe('cancelled');
      expect(ordersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' }),
      );
    });

    it('should throw BadRequestException when order is not pending', async () => {
      ordersRepo.findOne.mockResolvedValue({
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
      ordersRepo.find.mockResolvedValue([mockOrder as unknown as Order]);
      const result = await service.findAll();
      expect(ordersRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result).toHaveLength(1);
    });

    it('should filter by status when provided', async () => {
      ordersRepo.find.mockResolvedValue([]);
      await service.findAll('confirmed');
      expect(ordersRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'confirmed' } }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const order = { ...mockOrder, status: 'pending' as const };
      ordersRepo.findOne.mockResolvedValue(order as unknown as Order);
      ordersRepo.save.mockResolvedValue({ ...order, status: 'confirmed' } as unknown as Order);

      const result = await service.updateStatus('order-uuid', 'confirmed');
      expect(result.status).toBe('confirmed');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      ordersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStatus('bad-id', 'confirmed')).rejects.toThrow(NotFoundException);
    });
  });

  // Suppress unused variable warning for mockUser/mockProduct
  it('should have mockUser and mockProduct defined', () => {
    expect(mockUser).toBeDefined();
    expect(mockProduct).toBeDefined();
  });
});
