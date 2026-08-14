import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ModuleType } from './order.entity';

export enum BannerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
}

@Entity('banners')
@Index(['moduleType'])
@Index(['status'])
export class Banner extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ type: 'enum', enum: ModuleType, nullable: true })
  moduleType?: ModuleType;

  @Column({ type: 'uuid', nullable: true })
  zoneId?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deepLink?: string;

  @Column({ type: 'enum', enum: BannerStatus, default: BannerStatus.INACTIVE })
  status: BannerStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate?: Date;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
