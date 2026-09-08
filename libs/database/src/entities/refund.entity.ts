import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('refunds')
@Index(['orderId'])
@Index(['jobId'])
@Index(['status'])
export class Refund extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'uuid', nullable: true })
  jobId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.PENDING })
  status: RefundStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refundId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processedAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;
}
