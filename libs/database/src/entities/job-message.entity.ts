import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum SenderType {
  CUSTOMER = 'customer',
  TASKER = 'tasker',
  SYSTEM = 'system',
}

@Entity('job_messages')
@Index(['jobId'])
@Index(['createdAt'])
export class JobMessage extends BaseEntity {
  @Column({ type: 'uuid' })
  jobId: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'enum', enum: SenderType })
  senderType: SenderType;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Record<string, any>[];

  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
