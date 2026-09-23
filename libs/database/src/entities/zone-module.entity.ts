import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Zone } from './zone.entity';
import { ModuleType } from './order.entity';

@Entity('zone_modules')
@Index(['zoneId'])
export class ZoneModule extends BaseEntity {
  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  moduleName: ModuleType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  commissionPercent: number;

  @ManyToOne(() => Zone, (zone) => zone.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;
}
