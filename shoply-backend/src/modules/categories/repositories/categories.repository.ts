import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.repo.find();
  }

  save(category: Partial<Category>): Promise<Category> {
    return this.repo.save(category as Category);
  }
}
