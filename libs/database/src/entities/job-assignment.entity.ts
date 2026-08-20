import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('job_assignments')
@Index(['jobId'])
@Index(['taskerId'])
export class JobAssignment extends BaseEntity {
  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'uuid' })
  taskerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  acceptedPrice: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endTime?: Date;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'boolean', default: false })
  customerVerified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  completionNotes?: string;
}
