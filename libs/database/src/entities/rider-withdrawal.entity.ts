import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WithdrawalMethod {
  BANK_TRANSFER = 'bank_transfer',
  STRIPE = 'stripe',
  WALLET = 'wallet',
}

@Entity('rider_withdrawals')
@Index(['riderId'])
@Index(['status'])
export class RiderWithdrawal extends BaseEntity {
  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: WithdrawalMethod })
  method: WithdrawalMethod;

  @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId?: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;
}
