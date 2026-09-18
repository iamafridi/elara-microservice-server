import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TaskerPortfolio } from './tasker-portfolio.entity';

export enum TaskerStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  SUSPENDED = 'suspended',
}

@Entity('tasker_profiles')
@Index(['userId'])
@Index(['status'])
export class TaskerProfile extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate?: number;

  @Column({ type: 'boolean', default: false })
  fixedRateEnabled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  serviceRadiusMiles: number;

  @Column({ type: 'jsonb', nullable: true })
  skills?: string[];

  @Column({ type: 'jsonb', nullable: true })
  availability?: Record<string, any>;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalJobs: number;

  @Column({ type: 'int', default: 0 })
  completedJobs: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'boolean', default: false })
  profileVerified: boolean;

  @Column({ type: 'enum', enum: TaskerStatus, default: TaskerStatus.PENDING })
  status: TaskerStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  profilePicture?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeAccountId?: string;

  @Column({ type: 'jsonb', nullable: true })
  bankDetails?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => TaskerPortfolio, (portfolio) => portfolio.tasker)
  portfolio: TaskerPortfolio[];
}
