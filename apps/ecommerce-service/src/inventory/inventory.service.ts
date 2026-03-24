import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { ProductVariant } from '../../../../libs/database/src/entities/product-variant.entity';
import { BulkSyncInventoryDto, SyncInventoryItemDto, AdjustInventoryDto } from './dto/sync-inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Get inventory status for a product
   */
  async getProductInventory(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return null;
    }

    return {
      productId: product.id,
      stockQuantity: product.stockCount,
      trackInventory: product.stockEnabled,
      isInStock: product.stockEnabled ? product.stockCount > 0 : true,
      lowStockThreshold: 10,
      isLowStock: product.stockEnabled ? product.stockCount <= 10 : false,
    };
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(merchantId?: string, threshold: number = 10) {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    queryBuilder
      .where('product.stockEnabled = :stockEnabled', { stockEnabled: true })
      .andWhere('product.stockCount <= :threshold', { threshold })
      .andWhere('product.isActive = :isActive', { isActive: true });

    if (merchantId) {
      queryBuilder.andWhere('product.merchantId = :merchantId', { merchantId });
    }

    const products = await queryBuilder.getMany();

    return products.map((product) => ({
      productId: product.id,
      name: product.name,
      stockQuantity: product.stockCount,
    }));
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(merchantId?: string) {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    queryBuilder
      .where('product.stockEnabled = :stockEnabled', { stockEnabled: true })
      .andWhere('product.stockCount = :stockCount', { stockCount: 0 })
      .andWhere('product.isActive = :isActive', { isActive: true });

    if (merchantId) {
      queryBuilder.andWhere('product.merchantId = :merchantId', { merchantId });
    }

    const products = await queryBuilder.getMany();

    return products.map((product) => ({
      productId: product.id,
      name: product.name,
    }));
  }

  /**
   * Get inventory summary
   */
  async getInventorySummary(merchantId?: string) {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (merchantId) {
      queryBuilder.where('product.merchantId = :merchantId', { merchantId });
    }

    const totalProducts = await queryBuilder.getCount();

    const inStockCount = await queryBuilder
      .clone()
      .andWhere('product.stockEnabled = :stockEnabled', { stockEnabled: true })
      .andWhere('product.stockCount > :stockCount', { stockCount: 0 })
      .getCount();

    const outOfStockCount = await queryBuilder
      .clone()
      .andWhere('product.stockEnabled = :stockEnabled', { stockEnabled: true })
      .andWhere('product.stockCount = :stockCount', { stockCount: 0 })
      .getCount();

    const lowStockCount = await queryBuilder
      .clone()
      .andWhere('product.stockEnabled = :stockEnabled', { stockEnabled: true })
      .andWhere('product.stockCount > :minStock', { minStock: 0 })
      .andWhere('product.stockCount <= :maxStock', { maxStock: 10 })
      .getCount();

    return {
      totalProducts,
      inStockCount,
      outOfStockCount,
      lowStockCount,
    };
  }

  // ========== INVENTORY SYNC FEATURES ==========

  /**
   * Bulk sync inventory from external system
   */
  async bulkSyncInventory(dto: BulkSyncInventoryDto) {
    const results = [];
    const errors = [];

    for (const item of dto.items) {
      try {
        const result = await this.syncInventoryItem(item, dto.enableTracking);
        results.push(result);
      } catch (error) {
        errors.push({
          productId: item.productId,
          variantId: item.variantId,
          error: error.message,
        });
      }
    }

    this.logger.log(`Bulk inventory sync completed for merchant ${dto.merchantId}: ${results.length} success, ${errors.length} errors`);

    return {
      merchantId: dto.merchantId,
      syncedCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  /**
   * Sync individual inventory item
   */
  private async syncInventoryItem(item: SyncInventoryItemDto, enableTracking?: boolean) {
    if (item.variantId) {
      // Sync variant inventory
      const variant = await this.variantRepository.findOne({
        where: { id: item.variantId, productId: item.productId },
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} not found for product ${item.productId}`);
      }

      const previousStock = variant.stockCount;
      variant.stockCount = item.quantity;

      if (enableTracking !== undefined) {
        variant.stockEnabled = enableTracking;
      }

      await this.variantRepository.save(variant);

      this.logger.log(`Variant inventory synced: ${item.variantId} - ${previousStock} -> ${item.quantity}${item.reason ? ` (${item.reason})` : ''}`);

      return {
        type: 'variant',
        id: variant.id,
        productId: item.productId,
        previousStock,
        newStock: item.quantity,
        adjustment: item.quantity - previousStock,
        reason: item.reason,
      };
    } else {
      // Sync product inventory
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const previousStock = product.stockCount;
      product.stockCount = item.quantity;

      if (enableTracking !== undefined) {
        product.stockEnabled = enableTracking;
      }

      await this.productRepository.save(product);

      this.logger.log(`Product inventory synced: ${item.productId} - ${previousStock} -> ${item.quantity}${item.reason ? ` (${item.reason})` : ''}`);

      return {
        type: 'product',
        id: product.id,
        previousStock,
        newStock: item.quantity,
        adjustment: item.quantity - previousStock,
        reason: item.reason,
      };
    }
  }

  /**
   * Adjust inventory (add or subtract stock)
   */
  async adjustInventory(dto: AdjustInventoryDto) {
    if (dto.type === 'variant') {
      const variant = await this.variantRepository.findOne({
        where: { id: dto.id },
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${dto.id} not found`);
      }

      const previousStock = variant.stockCount;
      const newStock = previousStock + dto.adjustment;

      if (newStock < 0) {
        throw new BadRequestException('Adjustment would result in negative stock');
      }

      variant.stockCount = newStock;
      await this.variantRepository.save(variant);

      this.logger.log(`Variant inventory adjusted: ${dto.id} - ${previousStock} -> ${newStock} (${dto.adjustment > 0 ? '+' : ''}${dto.adjustment}) - ${dto.reason}`);

      return {
        type: 'variant',
        id: variant.id,
        previousStock,
        newStock,
        adjustment: dto.adjustment,
        reason: dto.reason,
      };
    } else {
      const product = await this.productRepository.findOne({
        where: { id: dto.id },
      });

      if (!product) {
        throw new NotFoundException(`Product ${dto.id} not found`);
      }

      const previousStock = product.stockCount;
      const newStock = previousStock + dto.adjustment;

      if (newStock < 0) {
        throw new BadRequestException('Adjustment would result in negative stock');
      }

      product.stockCount = newStock;
      await this.productRepository.save(product);

      this.logger.log(`Product inventory adjusted: ${dto.id} - ${previousStock} -> ${newStock} (${dto.adjustment > 0 ? '+' : ''}${dto.adjustment}) - ${dto.reason}`);

      return {
        type: 'product',
        id: product.id,
        previousStock,
        newStock,
        adjustment: dto.adjustment,
        reason: dto.reason,
      };
    }
  }

  /**
   * Get variant inventory status
   */
  async getVariantInventory(variantId: string) {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException(`Variant ${variantId} not found`);
    }

    return {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product?.name,
      variantName: variant.name,
      stockQuantity: variant.stockCount,
      trackInventory: variant.stockEnabled,
      isInStock: variant.stockEnabled ? variant.stockCount > 0 : true,
      lowStockThreshold: 10,
      isLowStock: variant.stockEnabled ? variant.stockCount <= 10 : false,
    };
  }

  /**
   * Get all variants with low stock
   */
  async getLowStockVariants(merchantId?: string, threshold: number = 10) {
    const queryBuilder = this.variantRepository.createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('variant.stockEnabled = :stockEnabled', { stockEnabled: true })
      .andWhere('variant.stockCount <= :threshold', { threshold })
      .andWhere('variant.isActive = :isActive', { isActive: true });

    if (merchantId) {
      queryBuilder.andWhere('product.merchantId = :merchantId', { merchantId });
    }

    const variants = await queryBuilder.getMany();

    return variants.map(variant => ({
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product?.name,
      variantName: variant.name,
      stockQuantity: variant.stockCount,
    }));
  }

  /**
   * Enable/disable stock tracking for multiple products
   */
  async toggleStockTracking(productIds: string[], enable: boolean) {
    const products = await this.productRepository.findByIds(productIds);

    if (products.length === 0) {
      throw new NotFoundException('No products found with the provided IDs');
    }

    for (const product of products) {
      product.stockEnabled = enable;
    }

    await this.productRepository.save(products);

    this.logger.log(`Stock tracking ${enable ? 'enabled' : 'disabled'} for ${products.length} products`);

    return {
      success: true,
      updatedCount: products.length,
      stockTrackingEnabled: enable,
    };
  }
}
