import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { JobCategory } from './job-category.entity';
import { JobQuote } from './job-quote.entity';

export enum JobStatus {
  POSTED = 'posted',
  QUOTED = 'quoted',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BudgetType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
}

@Entity('jobs')
@Index(['customerId'])
@Index(['categoryId'])
@Index(['status'])
@Index(['latitude', 'longitude'])
@Index(['createdAt'])
export class Job extends BaseEntity {
  @Column({ type: 'uuid' })
  customerId: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'uuid', nullable: true })
  subcategoryId?: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  photos?: string[];

  @Column({ type: 'simple-array', nullable: true })
  videos?: string[];

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 20 })
  postcode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'enum', enum: BudgetType })
  budgetType: BudgetType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budgetAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  radiusMiles: number;

  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.POSTED })
  status: JobStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  preferredStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @ManyToOne(() => JobCategory)
  @JoinColumn({ name: 'categoryId' })
  category: JobCategory;

  @OneToMany(() => JobQuote, (quote) => quote.job)
  quotes: JobQuote[];
}
