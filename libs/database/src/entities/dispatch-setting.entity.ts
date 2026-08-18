import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('dispatch_settings')
@Index(['zoneId'])
export class DispatchSetting extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  zoneId: string;

  @Column({ type: 'boolean', default: true })
  autoAssign: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  riderRadiusKm: number;

  @Column({ type: 'jsonb', nullable: true })
  priorityMatrix?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  batchingEnabled: boolean;

  @Column({ type: 'int', default: 20 })
  acceptanceTimeoutSeconds: number;
}
