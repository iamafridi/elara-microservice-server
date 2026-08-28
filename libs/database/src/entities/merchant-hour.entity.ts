import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Merchant } from './merchant.entity';

export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

@Entity('merchant_hours')
@Index(['merchantId', 'day'])
export class MerchantHour extends BaseEntity {
  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'int' })
  day: DayOfWeek;

  @Column({ type: 'time' })
  openTime: string;

  @Column({ type: 'time' })
  closeTime: string;

  @Column({ type: 'boolean', default: false })
  isClosed: boolean;

  @ManyToOne(() => Merchant, (merchant) => merchant.hours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;
}
