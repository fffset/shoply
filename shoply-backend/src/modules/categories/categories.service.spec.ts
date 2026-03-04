import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

const mockCategory: Category = {
  id: 'cat-uuid',
  name: 'Electronics',
  slug: 'electronics',
  products: [],
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repo = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      repo.find.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(result).toEqual([mockCategory]);
      expect(repo.find).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no categories exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create and save a category', async () => {
      repo.create.mockReturnValue(mockCategory);
      repo.save.mockResolvedValue(mockCategory);

      const dto = { name: 'Electronics', slug: 'electronics' };
      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual(mockCategory);
    });
  });
});
