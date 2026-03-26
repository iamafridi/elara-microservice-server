import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Merchant ID' })
  @IsUUID()
  merchantId: string;

  @ApiProperty({ description: 'Product category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Base price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Compare at price (original price)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ description: 'Cost per item', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPerItem?: number;

  @ApiProperty({ description: 'SKU', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ description: 'Barcode', required: false })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ description: 'Track inventory', required: false })
  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @ApiProperty({ description: 'Initial stock quantity', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number;

  @ApiProperty({ description: 'Product image URLs', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Is product active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
