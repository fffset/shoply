import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './repositories/categories.repository';
import { Category } from './entities/category.entity';

const mockCategory: Category = {
  id: 'cat-uuid',
  name: 'Electronics',
  slug: 'electronics',
  products: [],
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: jest.Mocked<CategoriesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: CategoriesRepository,
          useValue: {
            findAll: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoriesRepository = module.get(CategoriesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      categoriesRepository.findAll.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
      expect(categoriesRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no categories exist', async () => {
      categoriesRepository.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create and save a category', async () => {
      categoriesRepository.save.mockResolvedValue(mockCategory);

      const dto = { name: 'Electronics', slug: 'electronics' };
      const result = await service.create(dto);

      expect(categoriesRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCategory);
    });
  });
});
