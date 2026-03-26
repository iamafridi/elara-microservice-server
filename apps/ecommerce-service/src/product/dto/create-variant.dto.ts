import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Variant name', example: 'Small' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Additional price (added to base price)', example: 0 })
  @IsNumber()
  @Min(0)
  additionalPrice: number;

  @ApiPropertyOptional({ description: 'Enable stock tracking for this variant', default: false })
  @IsBoolean()
  @IsOptional()
  stockEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Initial stock count', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockCount?: number;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is variant active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateVariantDto {
  @ApiPropertyOptional({ description: 'Variant name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Additional price' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  additionalPrice?: number;

  @ApiPropertyOptional({ description: 'Enable stock tracking' })
  @IsBoolean()
  @IsOptional()
  stockEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Stock count' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockCount?: number;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is variant active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
