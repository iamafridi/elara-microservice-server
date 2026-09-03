import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum PayeeType {
  MERCHANT = 'merchant',
  RIDER = 'rider',
  TASKER = 'tasker',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutMethod {
  STRIPE_TRANSFER = 'stripe_transfer',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
}

@Entity('payouts')
@Index(['payeeId', 'payeeType'])
@Index(['status'])
@Index(['createdAt'])
export class Payout extends BaseEntity {
  @Column({ type: 'uuid' })
  payeeId: string;

  @Column({ type: 'enum', enum: PayeeType })
  payeeType: PayeeType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PayoutMethod })
  method: PayoutMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeTransferId?: string;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}
