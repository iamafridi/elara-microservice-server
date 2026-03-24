import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsObject, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Price at time of order' })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Merchant ID' })
  @IsUUID()
  merchantId: string;

  @ApiProperty({ description: 'Delivery address ID', required: false })
  @IsUUID()
  @IsOptional()
  deliveryAddressId?: string;

  @ApiProperty({ description: 'Payment method ID', required: false })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiProperty({ description: 'Order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Delivery fee' })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ description: 'Special instructions', required: false })
  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @ApiProperty({ description: 'Order metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
