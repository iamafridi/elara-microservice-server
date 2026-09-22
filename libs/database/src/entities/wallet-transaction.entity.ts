import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum ReferenceType {
  ORDER = 'order',
  JOB = 'job',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  TOPUP = 'topup',
  PAYOUT = 'payout',
  CASHBACK = 'cashback',
  TRANSFER = 'transfer',
}

@Entity('wallet_transactions')
@Index(['walletId'])
@Index(['referenceType', 'referenceId'])
@Index(['createdAt'])
export class WalletTransaction extends BaseEntity {
  @Column({ type: 'uuid' })
  walletId: string;

  @Column({ type: 'enum', enum: TransactionType })
  transactionType: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ReferenceType })
  referenceType: ReferenceType;

  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;
}
