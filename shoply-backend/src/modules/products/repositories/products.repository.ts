import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async findAll(
    page = 1,
    limit = 12,
    categoryId?: string,
    search?: string,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const qb = this.repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }
    if (search) {
      qb.andWhere('product.name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total, page, limit };
  }

  findById(id: string): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(product: Partial<Product>): Promise<Product> {
    return this.repo.save(product as Product);
  }

  async remove(product: Product): Promise<void> {
    await this.repo.remove(product);
  }
}
