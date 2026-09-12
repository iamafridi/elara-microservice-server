import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('rider_followers')
@Index(['followerRiderId'])
@Index(['followingRiderId'])
@Index(['followerRiderId', 'followingRiderId'], { unique: true })
export class RiderFollower extends BaseEntity {
  @Column({ type: 'uuid' })
  followerRiderId: string;

  @Column({ type: 'uuid' })
  followingRiderId: string;
}
