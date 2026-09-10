import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rider_feed_comments')
@Index(['videoId'])
@Index(['riderId'])
@Index(['parentCommentId'])
export class RiderFeedComment extends BaseEntity {
  @Column({ type: 'uuid' })
  videoId: string;

  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'uuid', nullable: true })
  parentCommentId?: string;

  @Column({ type: 'text' })
  commentText: string;
}
