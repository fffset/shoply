import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './repositories/products.repository';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  findAll(page = 1, limit = 12, categoryId?: string, search?: string) {
    return this.productsRepository.findAll(page, limit, categoryId, search);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto): Promise<Product> {
    return this.productsRepository.save({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      imageUrl: dto.imageUrl,
      ...(dto.categoryId && { category: { id: dto.categoryId } as never }),
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.stock !== undefined && { stock: dto.stock }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.categoryId !== undefined && { category: { id: dto.categoryId } }),
    });
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }
}
