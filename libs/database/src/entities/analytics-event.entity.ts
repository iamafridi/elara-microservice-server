import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('analytics_events')
@Index(['userId'])
@Index(['eventName'])
@Index(['timestamp'])
export class AnalyticsEvent extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 100 })
  eventName: string;

  @Column({ type: 'jsonb', nullable: true })
  eventData?: Record<string, any>;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}
