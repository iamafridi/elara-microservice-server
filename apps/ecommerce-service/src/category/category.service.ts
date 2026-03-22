import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from '../../../../libs/database/src/entities/product-category.entity';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(ProductCategory)
    private categoryRepository: Repository<ProductCategory>,
  ) {}

  /**
   * Get all categories
   */
  async findAll() {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return categories;
  }

  /**
   * Get category by ID
   */
  async findOne(id: string) {
    return this.categoryRepository.findOne({ where: { id } });
  }

  /**
   * Get category tree (parent-child relationships)
   */
  async getCategoryTree() {
    const categories = await this.findAll();
    return categories;
  }
}
