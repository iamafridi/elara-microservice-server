import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { BulkSyncInventoryDto, AdjustInventoryDto } from './dto/sync-inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get product inventory status' })
  @ApiResponse({ status: 200, description: 'Product inventory' })
  getProductInventory(@Param('productId') productId: string) {
    return this.inventoryService.getProductInventory(productId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiResponse({ status: 200, description: 'Low stock products' })
  getLowStockProducts(
    @Query('merchantId') merchantId?: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.inventoryService.getLowStockProducts(merchantId, threshold);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get out of stock products' })
  @ApiResponse({ status: 200, description: 'Out of stock products' })
  getOutOfStockProducts(@Query('merchantId') merchantId?: string) {
    return this.inventoryService.getOutOfStockProducts(merchantId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary' })
  @ApiResponse({ status: 200, description: 'Inventory summary' })
  getInventorySummary(@Query('merchantId') merchantId?: string) {
    return this.inventoryService.getInventorySummary(merchantId);
  }

  // ========== INVENTORY SYNC ENDPOINTS ==========

  @Post('sync')
  @ApiOperation({
    summary: 'Bulk sync inventory',
    description: 'Sync inventory from external systems (ERP, POS, etc.)'
  })
  @ApiResponse({ status: 200, description: 'Inventory synced' })
  bulkSyncInventory(@Body() dto: BulkSyncInventoryDto) {
    return this.inventoryService.bulkSyncInventory(dto);
  }

  @Post('adjust')
  @ApiOperation({
    summary: 'Adjust inventory',
    description: 'Make manual inventory adjustments (add or subtract stock)'
  })
  @ApiResponse({ status: 200, description: 'Inventory adjusted' })
  adjustInventory(@Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjustInventory(dto);
  }

  @Get('variant/:variantId')
  @ApiOperation({ summary: 'Get variant inventory status' })
  @ApiResponse({ status: 200, description: 'Variant inventory' })
  getVariantInventory(@Param('variantId') variantId: string) {
    return this.inventoryService.getVariantInventory(variantId);
  }

  @Get('variants/low-stock')
  @ApiOperation({ summary: 'Get low stock variants' })
  @ApiResponse({ status: 200, description: 'Low stock variants' })
  getLowStockVariants(
    @Query('merchantId') merchantId?: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.inventoryService.getLowStockVariants(merchantId, threshold);
  }

  @Put('toggle-tracking')
  @ApiOperation({
    summary: 'Enable/disable stock tracking',
    description: 'Bulk enable or disable stock tracking for products'
  })
  @ApiResponse({ status: 200, description: 'Stock tracking updated' })
  toggleStockTracking(
    @Body('productIds') productIds: string[],
    @Body('enable') enable: boolean,
  ) {
    return this.inventoryService.toggleStockTracking(productIds, enable);
  }
}
