import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rider_feed_likes')
@Index(['videoId'])
@Index(['riderId'])
@Index(['videoId', 'riderId'], { unique: true })
export class RiderFeedLike extends BaseEntity {
  @Column({ type: 'uuid' })
  videoId: string;

  @Column({ type: 'uuid' })
  riderId: string;
}
