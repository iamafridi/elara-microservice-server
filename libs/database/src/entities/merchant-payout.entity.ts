import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PayoutStatus, PayoutMethod } from './payout.entity';

@Entity('merchant_payouts')
@Index(['merchantId'])
@Index(['status'])
export class MerchantPayout extends BaseEntity {
  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Column({ type: 'enum', enum: PayoutMethod })
  payoutMethod: PayoutMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt?: Date;
}
