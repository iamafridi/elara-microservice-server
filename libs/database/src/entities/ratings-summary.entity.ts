import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('ratings_summary')
@Index(['entityId', 'entityType'])
export class RatingsSummary extends BaseEntity {
  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'jsonb', nullable: true })
  ratingDistribution?: Record<string, number>;
}
