import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rider_zones')
@Index(['riderId'])
@Index(['zoneId'])
export class RiderZone extends BaseEntity {
  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
