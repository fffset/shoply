import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './repositories/categories.repository';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.findAll();
  }

  create(dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesRepository.save(dto);
  }
}
