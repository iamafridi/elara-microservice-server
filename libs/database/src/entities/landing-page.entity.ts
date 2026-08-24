import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ModuleType } from './order.entity';

export enum PageStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

@Entity('landing_pages')
@Index(['slug'])
@Index(['moduleType'])
@Index(['status'])
export class LandingPage extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  metaDescription?: string;

  @Column({ type: 'varchar', length: 255 })
  h1: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  schema?: Record<string, any>;

  @Column({ type: 'enum', enum: ModuleType, nullable: true })
  moduleType?: ModuleType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postcode?: string;

  @Column({ type: 'enum', enum: PageStatus, default: PageStatus.DRAFT })
  status: PageStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  publishedAt?: Date;
}
