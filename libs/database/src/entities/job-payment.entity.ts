import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum JobPaymentStatus {
  PENDING = 'pending',
  DEPOSITED = 'deposited',
  RELEASED = 'released',
  REFUNDED = 'refunded',
}

@Entity('job_payments')
@Index(['jobId'])
@Index(['customerId'])
@Index(['taskerId'])
@Index(['paymentStatus'])
export class JobPayment extends BaseEntity {
  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid' })
  taskerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  depositAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'enum', enum: JobPaymentStatus, default: JobPaymentStatus.PENDING })
  paymentStatus: JobPaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  depositedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  releasedAt?: Date;
}
