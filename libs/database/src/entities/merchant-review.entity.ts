import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('merchant_reviews')
@Index(['orderId'])
@Index(['merchantId'])
@Index(['customerId'])
export class MerchantReview extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  reviewText?: string;

  @Column({ type: 'text', nullable: true })
  replyText?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  repliedAt?: Date;
}
