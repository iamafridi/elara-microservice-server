import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ModuleType } from './order.entity';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

@Entity('promo_codes')
@Index(['code'])
@Index(['validFrom', 'validUntil'])
export class PromoCode extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscount?: number;

  @Column({ type: 'enum', enum: ModuleType, nullable: true })
  moduleRestriction?: ModuleType;

  @Column({ type: 'uuid', nullable: true })
  zoneRestriction?: string;

  @Column({ type: 'int', nullable: true })
  usageLimit?: number;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamp with time zone' })
  validFrom: Date;

  @Column({ type: 'timestamp with time zone' })
  validUntil: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
