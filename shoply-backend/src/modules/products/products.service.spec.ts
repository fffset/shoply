import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
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
  let repo: jest.Mocked<Repository<Product>>;

  // Mock QueryBuilder with chainable methods
  const mockQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repo = module.get(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset mockReturnThis chains
    mockQb.leftJoinAndSelect.mockReturnThis();
    mockQb.andWhere.mockReturnThis();
    mockQb.skip.mockReturnThis();
    mockQb.take.mockReturnThis();
    mockQb.orderBy.mockReturnThis();
  });

  describe('findAll', () => {
    it('should return paginated result without filters', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockProduct], 1]);
      const result = await service.findAll(1, 12);
      expect(result).toEqual({ data: [mockProduct], total: 1, page: 1, limit: 12 });
      expect(mockQb.andWhere).not.toHaveBeenCalled();
    });

    it('should apply categoryId filter when provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll(1, 12, 'cat-uuid');
      expect(mockQb.andWhere).toHaveBeenCalledWith('category.id = :categoryId', {
        categoryId: 'cat-uuid',
      });
    });

    it('should apply ILIKE search filter when provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll(1, 12, undefined, 'shirt');
      expect(mockQb.andWhere).toHaveBeenCalledWith('product.name ILIKE :search', {
        search: '%shirt%',
      });
    });

    it('should calculate correct skip for page 2', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll(2, 12);
      expect(mockQb.skip).toHaveBeenCalledWith(12); // (2 - 1) * 12
    });

    it('should apply both filters when both provided', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[mockProduct], 1]);
      await service.findAll(1, 5, 'cat-uuid', 'shirt');
      expect(mockQb.andWhere).toHaveBeenCalledTimes(2);
      expect(mockQb.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findOne', () => {
    it('should return a product when found', async () => {
      repo.findOne.mockResolvedValue(mockProduct as Product);
      const result = await service.findOne('prod-uuid');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a product without categoryId', async () => {
      repo.create.mockReturnValue(mockProduct as Product);
      repo.save.mockResolvedValue(mockProduct as Product);

      const dto = { name: 'Test Product', description: 'desc', price: 29.99, stock: 10 };
      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Product' }),
      );
      expect(result).toEqual(mockProduct);
    });

    it('should assign category when categoryId is provided', async () => {
      repo.create.mockReturnValue(mockProduct as Product);
      repo.save.mockResolvedValue(mockProduct as Product);

      const dto = { name: 'Test', price: 10, stock: 5, categoryId: 'cat-uuid' };
      await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ category: { id: 'cat-uuid' } }),
      );
    });
  });

  describe('update', () => {
    it('should merge fields and save', async () => {
      repo.findOne.mockResolvedValue({ ...mockProduct } as Product);
      repo.save.mockResolvedValue({ ...mockProduct, name: 'Updated' } as Product);

      const result = await service.update('prod-uuid', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('bad-uuid', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the product', async () => {
      repo.findOne.mockResolvedValue(mockProduct as Product);
      repo.remove.mockResolvedValue(mockProduct as Product);

      await service.remove('prod-uuid');
      expect(repo.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
