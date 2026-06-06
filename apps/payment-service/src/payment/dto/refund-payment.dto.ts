import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({ description: 'Payment ID to refund' })
  @IsUUID()
  paymentId: string;

  @ApiProperty({
    description: 'Refund amount (partial refund if less than original)',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Refund reason for Stripe',
    enum: ['duplicate', 'fraudulent', 'requested_by_customer'],
    required: false,
  })
  @IsEnum(['duplicate', 'fraudulent', 'requested_by_customer'])
  @IsOptional()
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';

  @ApiProperty({ description: 'Human-readable refund reason', required: false })
  @IsString()
  @IsOptional()
  refundReason?: string;
}
