import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('product_categories')
@Index(['merchantId'])
export class ProductCategory extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  merchantId?: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
