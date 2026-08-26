import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('merchant_branches')
@Index(['merchantId'])
@Index(['zoneId'])
export class MerchantBranch extends BaseEntity {
  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'varchar', length: 255 })
  branchName: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'uuid', nullable: true })
  zoneId?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
