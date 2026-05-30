import { IsString, IsNumber, IsOptional, Min, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentPurpose {
  ORDER = 'order',
  JOB_BOOKING = 'job_booking',
  WALLET_TOPUP = 'wallet_topup',
  SUBSCRIPTION = 'subscription',
}

export class InitiateOpenBankingPaymentDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount in GBP', example: 50.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentPurpose })
  @IsEnum(PaymentPurpose)
  purpose: PaymentPurpose;

  @ApiPropertyOptional({ description: 'Order ID if purpose is ORDER' })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Job booking ID if purpose is JOB_BOOKING' })
  @IsUUID()
  @IsOptional()
  jobBookingId?: string;

  @ApiPropertyOptional({ description: 'Connected bank account ID' })
  @IsString()
  @IsOptional()
  bankAccountId?: string;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Redirect URI after payment' })
  @IsString()
  @IsOptional()
  redirectUri?: string;
}

export class ConfirmOpenBankingPaymentDto {
  @ApiProperty({ description: 'Payment ID from TrueLayer' })
  @IsString()
  paymentId: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;
}
