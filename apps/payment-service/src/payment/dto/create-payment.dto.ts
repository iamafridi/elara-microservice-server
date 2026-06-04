import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Currency', default: 'BDT' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description: 'Payment method',
    enum: ['card', 'wallet', 'cash', 'bank_transfer', 'bkash', 'nagad', 'sslcommerz', 'cash_on_delivery'],
  })
  @IsEnum(['card', 'wallet', 'cash', 'bank_transfer', 'bkash', 'nagad', 'sslcommerz', 'cash_on_delivery'])
  method: string;


  @ApiProperty({
    description: 'Payment status',
    enum: ['pending', 'completed', 'failed', 'refunded', 'partial_refund'],
    required: false,
  })
  @IsEnum(['pending', 'completed', 'failed', 'refunded', 'partial_refund'])
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Order ID', required: false })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Job booking ID', required: false })
  @IsUUID()
  @IsOptional()
  jobBookingId?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
