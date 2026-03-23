import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, Min, IsBoolean } from 'class-validator';

export class SyncInventoryItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Variant ID (if syncing variant stock)' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'New stock quantity' })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkSyncInventoryDto {
  @ApiProperty({
    description: 'Merchant ID',
  })
  @IsString()
  merchantId: string;

  @ApiProperty({
    description: 'Array of inventory items to sync',
    type: [SyncInventoryItemDto]
  })
  @IsArray()
  items: SyncInventoryItemDto[];

  @ApiPropertyOptional({ description: 'Whether to enable stock tracking for all items' })
  @IsBoolean()
  @IsOptional()
  enableTracking?: boolean;
}

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Product ID or Variant ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Type: "product" or "variant"' })
  @IsString()
  type: 'product' | 'variant';

  @ApiProperty({ description: 'Adjustment amount (positive or negative)' })
  @IsNumber()
  adjustment: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason: string;
}

export class ReserveStockDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'Variant ID' })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'Quantity to reserve' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Order ID or reference' })
  @IsString()
  orderId: string;
}
