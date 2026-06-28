import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';

export interface ProductSearchParams {
  query?: string;
  categoryId?: string;
  merchantId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price' | 'name' | 'popularity' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Search products with filters
   */
  async searchProducts(params: ProductSearchParams) {
    const {
      query,
      categoryId,
      merchantId,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'name',
      sortOrder = 'ASC',
      limit = 20,
      offset = 0,
    } = params;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Base filters
    queryBuilder
      .where('product.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('product.merchant', 'merchant')
      .leftJoinAndSelect('product.category', 'category');

    // Text search
    if (query) {
      queryBuilder.andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // Merchant filter
    if (merchantId) {
      queryBuilder.andWhere('product.merchantId = :merchantId', { merchantId });
    }

    // Price range filter
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Stock filter
    if (inStock) {
      queryBuilder.andWhere('product.stockEnabled = :stockEnabled', { stockEnabled: true });
      queryBuilder.andWhere('product.stockCount > :stockCount', { stockCount: 0 });
    }

    // Sorting
    switch (sortBy) {
      case 'price':
        queryBuilder.orderBy('product.price', sortOrder);
        break;
      case 'popularity':
        queryBuilder.orderBy('product.isFeatured', 'DESC');
        queryBuilder.addOrderBy('product.createdAt', 'DESC');
        break;
      case 'rating':
        queryBuilder.orderBy('product.isFeatured', 'DESC');
        queryBuilder.addOrderBy('product.name', sortOrder);
        break;
      default:
        queryBuilder.orderBy('product.name', sortOrder);
    }

    // Pagination
    queryBuilder.skip(offset).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images,
        isFeatured: product.isFeatured,
        inStock: product.stockEnabled ? product.stockCount > 0 : true,
        merchant: product.merchant ? {
          id: product.merchant.id,
          name: product.merchant.storeName,
          rating: product.merchant.rating,
        } : null,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
        } : null,
      })),
      total,
      limit,
      offset,
      hasMore: offset + products.length < total,
    };
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const products = await this.productRepository.find({
      where: [
        { name: ILike(`%${query}%`), isActive: true },
      ],
      select: ['id', 'name', 'price', 'images'],
      take: limit,
      order: { isFeatured: 'DESC', createdAt: 'DESC' },
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
    }));
  }

  /**
   * Get popular products
   */
  async getPopularProducts(limit: number = 10) {
    const products = await this.productRepository.find({
      where: { isActive: true, isFeatured: true },
      relations: ['merchant', 'category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      isFeatured: product.isFeatured,
      merchant: product.merchant ? {
        id: product.merchant.id,
        name: product.merchant.storeName,
      } : null,
    }));
  }

  /**
   * Get trending products (recent high sales)
   */
  async getTrendingProducts(limit: number = 10) {
    // Simplified trending logic - recently added featured products
    const products = await this.productRepository.find({
      where: { isActive: true, isFeatured: true },
      relations: ['merchant', 'category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      isFeatured: product.isFeatured,
      merchant: product.merchant ? {
        id: product.merchant.id,
        name: product.merchant.storeName,
      } : null,
    }));
  }
}
