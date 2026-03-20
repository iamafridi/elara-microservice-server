import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, BulkAddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Shopping Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'User cart' })
  getCart(@Param('userId') userId: string) {
    return this.cartService.getOrCreateCart(userId);
  }

  @Post(':userId/items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  addItem(@Param('userId') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Put(':userId/items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  updateItem(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(userId, itemId, dto);
  }

  @Delete(':userId/items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  removeItem(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }

  // ========== CART OPTIMIZATION ENDPOINTS ==========

  @Post(':userId/bulk-add')
  @ApiOperation({
    summary: 'Bulk add items to cart',
    description: 'Add multiple items to cart in a single request'
  })
  @ApiResponse({ status: 201, description: 'Items added to cart' })
  bulkAddItems(@Param('userId') userId: string, @Body() dto: BulkAddToCartDto) {
    return this.cartService.bulkAddItems(userId, dto);
  }

  @Get(':userId/validate')
  @ApiOperation({
    summary: 'Validate cart',
    description: 'Check cart for issues (unavailable products, stock issues, etc.)'
  })
  @ApiResponse({ status: 200, description: 'Cart validation results' })
  validateCart(@Param('userId') userId: string) {
    return this.cartService.validateCart(userId);
  }

  @Get(':userId/by-merchant')
  @ApiOperation({
    summary: 'Get cart grouped by merchant',
    description: 'Retrieve cart items organized by merchant for split orders'
  })
  @ApiResponse({ status: 200, description: 'Cart grouped by merchant' })
  getCartByMerchant(@Param('userId') userId: string) {
    return this.cartService.getCartByMerchant(userId);
  }

  @Delete(':userId/cleanup')
  @ApiOperation({
    summary: 'Remove unavailable items',
    description: 'Clean up cart by removing unavailable products and variants'
  })
  @ApiResponse({ status: 200, description: 'Unavailable items removed' })
  removeUnavailableItems(@Param('userId') userId: string) {
    return this.cartService.removeUnavailableItems(userId);
  }
}
