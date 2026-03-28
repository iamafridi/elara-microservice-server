import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { ProductVariant } from '../../../../libs/database/src/entities/product-variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/create-variant.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Create a new product
   */
  async create(dto: CreateProductDto) {
    const product = this.productRepository.create({
      merchantId: dto.merchantId,
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stockEnabled: dto.trackInventory ?? true,
      stockCount: dto.stockQuantity ?? 0,
      images: dto.images || [],
      isActive: dto.isActive ?? true,
    });

    await this.productRepository.save(product);
    this.logger.log(`Product created: ${product.id}`);

    return product;
  }

  /**
   * Get all products with filters
   */
  async findAll(
    limit: number = 50,
    offset: number = 0,
    merchantId?: string,
    categoryId?: string,
    search?: string,
    isActive?: boolean,
  ) {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (merchantId) {
      queryBuilder.andWhere('product.merchantId = :merchantId', { merchantId });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    const numericLimit = Number(limit) > 0 ? Number(limit) : 50;
    const numericOffset = Number(offset) >= 0 ? Number(offset) : 0;

    const [products, total] = await queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .take(numericLimit)
      .skip(numericOffset)
      .getManyAndCount();

    return {
      data: products,
      total,
      limit: numericLimit,
      offset: numericOffset,
    };
  }

  /**
   * Get product by ID
   */
  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'merchant', 'variants'],
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  /**
   * Update product
   */
  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    Object.assign(product, dto);
    await this.productRepository.save(product);

    this.logger.log(`Product updated: ${id}`);
    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async remove(id: string) {
    const product = await this.findOne(id);

    product.isActive = false;
    await this.productRepository.save(product);

    this.logger.log(`Product deactivated: ${id}`);
    return { deleted: true };
  }

  /**
   * Get merchant products
   */
  async findByMerchant(merchantId: string, limit: number = 50, offset: number = 0) {
    const [products, total] = await this.productRepository.findAndCount({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: products,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get category products
   */
  async findByCategory(categoryId: string, limit: number = 50, offset: number = 0) {
    const [products, total] = await this.productRepository.findAndCount({
      where: { categoryId, isActive: true },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      data: products,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number) {
    const product = await this.findOne(id);

    product.stockCount = quantity;
    await this.productRepository.save(product);

    this.logger.log(`Product stock updated: ${id} - ${quantity}`);
    return product;
  }

  /**
   * Decrease product stock
   */
  async decreaseStock(id: string, quantity: number) {
    const product = await this.findOne(id);

    if (product.stockEnabled) {
      if (product.stockCount < quantity) {
        throw new Error('Insufficient stock');
      }
      product.stockCount -= quantity;
      await this.productRepository.save(product);
    }

    return product;
  }

  /**
   * Increase product stock
   */
  async increaseStock(id: string, quantity: number) {
    const product = await this.findOne(id);

    product.stockCount += quantity;
    await this.productRepository.save(product);

    return product;
  }

  // ========== VARIANT MANAGEMENT ==========

  /**
   * Create a product variant
   */
  async createVariant(dto: CreateVariantDto) {
    const product = await this.findOne(dto.productId);

    const variant = this.variantRepository.create({
      productId: dto.productId,
      name: dto.name,
      additionalPrice: dto.additionalPrice,
      stockEnabled: dto.stockEnabled ?? false,
      stockCount: dto.stockCount ?? 0,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    await this.variantRepository.save(variant);
    this.logger.log(`Variant created: ${variant.id} for product ${dto.productId}`);

    return variant;
  }

  /**
   * Get all variants for a product
   */
  async getProductVariants(productId: string) {
    const product = await this.findOne(productId);

    const variants = await this.variantRepository.find({
      where: { productId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        basePrice: product.price,
      },
      variants,
    };
  }

  /**
   * Get variant by ID
   */
  async findVariant(id: string) {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException(`Variant ${id} not found`);
    }

    return variant;
  }

  /**
   * Update a product variant
   */
  async updateVariant(id: string, dto: UpdateVariantDto) {
    const variant = await this.findVariant(id);

    Object.assign(variant, dto);
    await this.variantRepository.save(variant);

    this.logger.log(`Variant updated: ${id}`);
    return variant;
  }

  /**
   * Delete a variant (soft delete)
   */
  async removeVariant(id: string) {
    const variant = await this.findVariant(id);

    variant.isActive = false;
    await this.variantRepository.save(variant);

    this.logger.log(`Variant deactivated: ${id}`);
    return { deleted: true };
  }

  /**
   * Update variant stock
   */
  async updateVariantStock(id: string, quantity: number) {
    const variant = await this.findVariant(id);

    if (!variant.stockEnabled) {
      throw new BadRequestException('Stock tracking not enabled for this variant');
    }

    variant.stockCount = quantity;
    await this.variantRepository.save(variant);

    this.logger.log(`Variant stock updated: ${id} - ${quantity}`);
    return variant;
  }

  /**
   * Decrease variant stock
   */
  async decreaseVariantStock(id: string, quantity: number) {
    const variant = await this.findVariant(id);

    if (variant.stockEnabled) {
      if (variant.stockCount < quantity) {
        throw new BadRequestException('Insufficient variant stock');
      }
      variant.stockCount -= quantity;
      await this.variantRepository.save(variant);
    }

    return variant;
  }

  /**
   * Increase variant stock
   */
  async increaseVariantStock(id: string, quantity: number) {
    const variant = await this.findVariant(id);

    variant.stockCount += quantity;
    await this.variantRepository.save(variant);

    return variant;
  }
}
