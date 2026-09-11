import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum VideoPrivacy {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

@Entity('rider_feed_videos')
@Index(['riderId'])
@Index(['createdAt'])
export class RiderFeedVideo extends BaseEntity {
  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'varchar', length: 500 })
  videoUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  caption?: string;

  @Column({ type: 'simple-array', nullable: true })
  hashtags?: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  music?: string;

  @Column({ type: 'enum', enum: VideoPrivacy, default: VideoPrivacy.PUBLIC })
  privacy: VideoPrivacy;

  @Column({ type: 'int', default: 0 })
  viewsCount: number;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;
}
