import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SenderType } from './job-message.entity';

@Entity('chat_messages')
@Index(['ticketId'])
@Index(['orderId'])
@Index(['jobId'])
@Index(['createdAt'])
export class ChatMessage extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  ticketId?: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'uuid', nullable: true })
  jobId?: string;

  @Column({ type: 'enum', enum: SenderType })
  senderType: SenderType;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Record<string, any>[];

  @Column({ type: 'boolean', default: false })
  isRead: boolean;
}
