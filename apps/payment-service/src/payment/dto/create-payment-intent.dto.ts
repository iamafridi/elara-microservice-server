import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Payment amount in GBP' })
  @IsNumber()
  @Min(0.5)
  amount: number;

  @ApiProperty({ description: 'Stripe customer ID', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Order ID', required: false })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Job booking ID', required: false })
  @IsUUID()
  @IsOptional()
  jobBookingId?: string;

  @ApiProperty({
    description: 'Merchant Stripe Connect account ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  merchantStripeAccountId?: string;

  @ApiProperty({
    description: 'Application fee amount (Elara platform commission)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  applicationFeeAmount?: number;
}
