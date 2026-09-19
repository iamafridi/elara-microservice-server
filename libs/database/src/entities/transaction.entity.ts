import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum PaymentMethod {
  BKASH = 'bkash',
  NAGAD = 'nagad',
  SSLCOMMERZ = 'sslcommerz',
  STRIPE = 'stripe',
  OPEN_BANKING = 'open_banking',
  WALLET = 'wallet',
  CASH = 'cash',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('transactions')
@Index(['userId'])
@Index(['orderId'])
@Index(['jobId'])
@Index(['paymentMethod'])
@Index(['status'])
@Index(['createdAt'])
export class Transaction extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'uuid', nullable: true })
  jobId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentIntentId?: string;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 500, nullable: true })
  errorMessage?: string;
}
