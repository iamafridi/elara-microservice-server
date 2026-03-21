import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../../../libs/database/src/entities/cart.entity';
import { CartItem } from '../../../../libs/database/src/entities/cart-item.entity';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { ProductVariant } from '../../../../libs/database/src/entities/product-variant.entity';
import { AddToCartDto, BulkAddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  /**
   * Get or create user cart
   */
  async getOrCreateCart(userId: string) {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId, moduleType: 'ECOMMERCE' as any });
      await this.cartRepository.save(cart);
      this.logger.log(`Cart created for user: ${userId}`);
    }

    return this.calculateCartTotals(cart);
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, dto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    let variant = null;
    if (dto.variantId) {
      variant = await this.variantRepository.findOne({
        where: { id: dto.variantId, productId: dto.productId },
      });

      if (!variant) {
        throw new NotFoundException(`Variant ${dto.variantId} not found for this product`);
      }

      if (!variant.isActive) {
        throw new BadRequestException('Variant is not available');
      }

      // Check variant stock
      if (variant.stockEnabled && variant.stockCount < dto.quantity) {
        throw new BadRequestException('Insufficient variant stock');
      }
    } else {
      // Check product stock if no variant
      if (product.stockEnabled && product.stockCount < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    // Check if identical item already in cart (same product, variant, addons, instructions)
    const existingItems = await this.cartItemRepository.find({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId || null,
      },
    });

    let cartItem = existingItems.find(item =>
      JSON.stringify(item.addons) === JSON.stringify(dto.addons) &&
      item.specialInstructions === dto.specialInstructions
    );

    if (cartItem) {
      // Update quantity
      cartItem.quantity += dto.quantity;
    } else {
      // Create new cart item
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        addons: dto.addons,
        specialInstructions: dto.specialInstructions,
      });
    }

    await this.cartItemRepository.save(cartItem);
    this.logger.log(`Item added to cart: ${userId} - ${dto.productId}${dto.variantId ? ` (variant: ${dto.variantId})` : ''}`);

    return this.getOrCreateCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
      relations: ['product'],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }

    // Check stock
    if (cartItem.product.stockEnabled && cartItem.product.stockCount < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cartItem.quantity = dto.quantity;
    await this.cartItemRepository.save(cartItem);

    this.logger.log(`Cart item updated: ${userId} - ${itemId}`);
    return this.getOrCreateCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item ${itemId} not found`);
    }

    await this.cartItemRepository.delete(itemId);
    this.logger.log(`Cart item removed: ${userId} - ${itemId}`);

    return this.getOrCreateCart(userId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.cartItemRepository.delete({ cartId: cart.id });
    this.logger.log(`Cart cleared: ${userId}`);

    return this.getOrCreateCart(userId);
  }

  /**
   * Calculate cart totals
   */
  private calculateCartTotals(cart: Cart) {
    let subtotal = 0;
    let totalItems = 0;

    if (cart.items) {
      cart.items.forEach((item) => {
        // Base product price
        let itemPrice = item.product ? parseFloat(item.product.price as any) : 0;

        // Add variant price modifier
        if (item.variant) {
          itemPrice += parseFloat(item.variant.additionalPrice as any);
        }

        // Add addon prices
        if (item.addons && Array.isArray(item.addons)) {
          item.addons.forEach((addon: any) => {
            if (addon.price) {
              itemPrice += parseFloat(addon.price);
            }
          });
        }

        subtotal += itemPrice * item.quantity;
        totalItems += item.quantity;
      });
    }

    return {
      ...cart,
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalItems,
      items: cart.items || [],
    };
  }

  // ========== CART OPTIMIZATION FEATURES ==========

  /**
   * Bulk add items to cart
   */
  async bulkAddItems(userId: string, dto: BulkAddToCartDto) {
    const results = [];
    const errors = [];

    for (const item of dto.items) {
      try {
        await this.addItem(userId, item);
        results.push({ productId: item.productId, success: true });
      } catch (error) {
        errors.push({
          productId: item.productId,
          error: error.message,
        });
      }
    }

    const cart = await this.getOrCreateCart(userId);

    return {
      cart,
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
    };
  }

  /**
   * Validate cart items (check availability, stock, price changes)
   */
  async validateCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const issues = [];

    for (const item of cart.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        issues.push({
          itemId: item.id,
          type: 'PRODUCT_NOT_FOUND',
          message: 'Product no longer available',
        });
        continue;
      }

      if (!product.isActive) {
        issues.push({
          itemId: item.id,
          type: 'PRODUCT_INACTIVE',
          message: 'Product is no longer available',
        });
      }

      if (item.variantId) {
        const variant = await this.variantRepository.findOne({
          where: { id: item.variantId },
        });

        if (!variant || !variant.isActive) {
          issues.push({
            itemId: item.id,
            type: 'VARIANT_UNAVAILABLE',
            message: 'Selected variant is no longer available',
          });
          continue;
        }

        if (variant.stockEnabled && variant.stockCount < item.quantity) {
          issues.push({
            itemId: item.id,
            type: 'INSUFFICIENT_STOCK',
            message: `Only ${variant.stockCount} items available`,
            availableQuantity: variant.stockCount,
          });
        }
      } else {
        if (product.stockEnabled && product.stockCount < item.quantity) {
          issues.push({
            itemId: item.id,
            type: 'INSUFFICIENT_STOCK',
            message: `Only ${product.stockCount} items available`,
            availableQuantity: product.stockCount,
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      cart,
    };
  }

  /**
   * Get cart grouped by merchant
   */
  async getCartByMerchant(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const merchantGroups = new Map();

    for (const item of cart.items) {
      const merchantId = item.product?.merchantId || 'unknown';

      if (!merchantGroups.has(merchantId)) {
        merchantGroups.set(merchantId, {
          merchantId,
          items: [],
          subtotal: 0,
          totalItems: 0,
        });
      }

      const group = merchantGroups.get(merchantId);
      group.items.push(item);

      // Calculate item price
      let itemPrice = parseFloat(item.product?.price as any || 0);
      if (item.variant) {
        itemPrice += parseFloat(item.variant.additionalPrice as any);
      }
      if (item.addons && Array.isArray(item.addons)) {
        item.addons.forEach((addon: any) => {
          if (addon.price) {
            itemPrice += parseFloat(addon.price);
          }
        });
      }

      group.subtotal += itemPrice * item.quantity;
      group.totalItems += item.quantity;
    }

    return {
      cart,
      merchantGroups: Array.from(merchantGroups.values()),
    };
  }

  /**
   * Remove unavailable items from cart
   */
  async removeUnavailableItems(userId: string) {
    const validation = await this.validateCart(userId);
    const removedItems = [];

    for (const issue of validation.issues) {
      if (issue.type === 'PRODUCT_NOT_FOUND' ||
          issue.type === 'PRODUCT_INACTIVE' ||
          issue.type === 'VARIANT_UNAVAILABLE') {
        await this.cartItemRepository.delete(issue.itemId);
        removedItems.push(issue.itemId);
      }
    }

    this.logger.log(`Removed ${removedItems.length} unavailable items from cart: ${userId}`);

    return {
      removedItems,
      cart: await this.getOrCreateCart(userId),
    };
  }
}
