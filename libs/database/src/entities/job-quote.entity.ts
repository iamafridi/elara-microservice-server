import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Job } from './job.entity';
import { TaskerProfile } from './tasker-profile.entity';

export enum QuoteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Entity('job_quotes')
@Index(['jobId'])
@Index(['taskerId'])
@Index(['status'])
export class JobQuote extends BaseEntity {
  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'uuid' })
  taskerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.PENDING })
  status: QuoteStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  rejectedAt?: Date;

  @ManyToOne(() => Job, (job) => job.quotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => TaskerProfile)
  @JoinColumn({ name: 'taskerId' })
  tasker: TaskerProfile;
}
