import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum RevieweeType {
  MERCHANT = 'merchant',
  RIDER = 'rider',
  TASKER = 'tasker',
  CUSTOMER = 'customer',
}

@Entity('reviews')
@Index(['orderId'])
@Index(['jobId'])
@Index(['reviewerId'])
@Index(['revieweeId', 'revieweeType'])
export class Review extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'uuid', nullable: true })
  jobId?: string;

  @Column({ type: 'uuid' })
  reviewerId: string;

  @Column({ type: 'uuid' })
  revieweeId: string;

  @Column({ type: 'enum', enum: RevieweeType })
  revieweeType: RevieweeType;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  reviewText?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'text', nullable: true })
  replyText?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  repliedAt?: Date;
}
