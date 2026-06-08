import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayoutDto {
  @ApiProperty({
    description: 'Recipient type',
    enum: ['merchant', 'rider', 'tasker'],
  })
  @IsEnum(['merchant', 'rider', 'tasker'])
  recipientType: 'merchant' | 'rider' | 'tasker';

  @ApiProperty({ description: 'Recipient ID (merchant/rider/tasker ID)' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ description: 'Payout amount in GBP' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Payout description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Related order ID', required: false })
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Related job booking ID', required: false })
  @IsUUID()
  @IsOptional()
  jobBookingId?: string;
}
