import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, Min, IsOptional, IsString, IsArray, MaxLength } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID (e.g., size, color)' })
  @IsUUID()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Product add-ons (e.g., extra toppings, customizations)',
    type: [Object],
    example: [{ id: 'addon-1', name: 'Extra Cheese', price: 2.50 }]
  })
  @IsArray()
  @IsOptional()
  addons?: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'Special instructions or notes',
    example: 'No onions, extra sauce'
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  specialInstructions?: string;
}

export class BulkAddToCartDto {
  @ApiProperty({
    description: 'Array of items to add to cart',
    type: [AddToCartDto]
  })
  @IsArray()
  items: AddToCartDto[];
}
