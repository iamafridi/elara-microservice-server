import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rider_locations')
@Index(['riderId'])
@Index(['timestamp'])
export class RiderLocation extends BaseEntity {
  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  heading?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy?: number;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
