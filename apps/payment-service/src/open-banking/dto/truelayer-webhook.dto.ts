import { IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TrueLayerWebhookEventType {
  PAYMENT_EXECUTED = 'payment_executed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SETTLED = 'payment_settled',
  REFUND_EXECUTED = 'refund_executed',
  REFUND_FAILED = 'refund_failed',
}

export enum TrueLayerPaymentStatus {
  AUTHORIZED = 'authorized',
  EXECUTED = 'executed',
  SETTLED = 'settled',
  FAILED = 'failed',
}

export class TrueLayerWebhookDto {
  @ApiProperty({ description: 'Event type' })
  @IsEnum(TrueLayerWebhookEventType)
  type: TrueLayerWebhookEventType;

  @ApiProperty({ description: 'Event ID' })
  @IsString()
  event_id: string;

  @ApiProperty({ description: 'Event timestamp' })
  @IsString()
  event_timestamp: string;

  @ApiProperty({ description: 'Payment ID' })
  @IsString()
  payment_id: string;

  @ApiPropertyOptional({ description: 'Payment status' })
  @IsEnum(TrueLayerPaymentStatus)
  @IsOptional()
  status?: TrueLayerPaymentStatus;

  @ApiPropertyOptional({ description: 'Failure reason' })
  @IsString()
  @IsOptional()
  failure_reason?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
