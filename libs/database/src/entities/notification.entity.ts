import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ModuleType } from './order.entity';

@Entity('notifications')
@Index(['userId'])
@Index(['readStatus'])
@Index(['createdAt'])
export class Notification extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: ModuleType, nullable: true })
  module?: ModuleType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deepLink?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'boolean', default: false })
  readStatus: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;
}
