import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('blog_posts')
@Index(['slug'])
@Index(['publishedAt'])
export class BlogPost extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 100 })
  author: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  metaDescription?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  featuredImage?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'timestamp with time zone', nullable: true })
  publishedAt?: Date;
}
