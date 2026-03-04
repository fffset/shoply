import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsRepository } from './repositories/products.repository';
import { Product } from './entities/product.entity';

const mockProduct: Partial<Product> = {
  id: 'prod-uuid',
  name: 'Test Product',
  description: 'A test product',
  price: 29.99,
  stock: 10,
  imageUrl: 'https://example.com/img.jpg',
};

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: jest.Mocked<ProductsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productsRepository = module.get(ProductsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated result without filters', async () => {
      const paginated = { data: [mockProduct as Product], total: 1, page: 1, limit: 12 };
      productsRepository.findAll.mockResolvedValue(paginated);
      const result = await service.findAll(1, 12);
      expect(result).toEqual(paginated);
      expect(productsRepository.findAll).toHaveBeenCalledWith(1, 12, undefined, undefined);
    });

    it('should pass categoryId filter to repository', async () => {
      productsRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 12 });
      await service.findAll(1, 12, 'cat-uuid');
      expect(productsRepository.findAll).toHaveBeenCalledWith(1, 12, 'cat-uuid', undefined);
    });

    it('should pass search filter to repository', async () => {
      productsRepository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 12 });
      await service.findAll(1, 12, undefined, 'shirt');
      expect(productsRepository.findAll).toHaveBeenCalledWith(1, 12, undefined, 'shirt');
    });

    it('should pass both filters to repository', async () => {
      productsRepository.findAll.mockResolvedValue({
        data: [mockProduct as Product],
        total: 1,
        page: 1,
        limit: 5,
      });
      await service.findAll(1, 5, 'cat-uuid', 'shirt');
      expect(productsRepository.findAll).toHaveBeenCalledWith(1, 5, 'cat-uuid', 'shirt');
    });
  });

  describe('findOne', () => {
    it('should return a product when found', async () => {
      productsRepository.findById.mockResolvedValue(mockProduct as Product);
      const result = await service.findOne('prod-uuid');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when not found', async () => {
      productsRepository.findById.mockResolvedValue(null);
      await expect(service.findOne('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a product without categoryId', async () => {
      productsRepository.save.mockResolvedValue(mockProduct as Product);

      const dto = { name: 'Test Product', description: 'desc', price: 29.99, stock: 10 };
      const result = await service.create(dto);

      expect(productsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Product' }),
      );
      expect(result).toEqual(mockProduct);
    });

    it('should assign category when categoryId is provided', async () => {
      productsRepository.save.mockResolvedValue(mockProduct as Product);

      const dto = { name: 'Test', price: 10, stock: 5, categoryId: 'cat-uuid' };
      await service.create(dto);

      expect(productsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ category: { id: 'cat-uuid' } }),
      );
    });
  });

  describe('update', () => {
    it('should merge fields and save', async () => {
      productsRepository.findById.mockResolvedValue({ ...mockProduct } as Product);
      productsRepository.save.mockResolvedValue({ ...mockProduct, name: 'Updated' } as Product);

      const result = await service.update('prod-uuid', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(productsRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productsRepository.findById.mockResolvedValue(null);
      await expect(service.update('bad-uuid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the product', async () => {
      productsRepository.findById.mockResolvedValue(mockProduct as Product);
      productsRepository.remove.mockResolvedValue(undefined);

      await service.remove('prod-uuid');
      expect(productsRepository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productsRepository.findById.mockResolvedValue(null);
      await expect(service.remove('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
