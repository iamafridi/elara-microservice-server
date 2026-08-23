import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('job_reviews')
@Index(['jobId'])
@Index(['customerId'])
@Index(['taskerId'])
export class JobReview extends BaseEntity {
  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid' })
  taskerId: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  reviewText?: string;
}
