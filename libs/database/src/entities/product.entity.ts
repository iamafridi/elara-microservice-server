import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Merchant } from './merchant.entity';
import { ProductCategory } from './product-category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductAddon } from './product-addon.entity';

@Entity('products')
@Index(['merchantId'])
@Index(['categoryId'])
@Index(['isActive'])
export class Product extends BaseEntity {
  @Column({ type: 'uuid' })
  merchantId: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false })
  stockEnabled: boolean;

  @Column({ type: 'int', nullable: true })
  stockCount?: number;

  @Column({ type: 'boolean', default: false })
  isWeightBased: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weightKg?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  weightUnit?: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => Merchant, (merchant) => merchant.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @ManyToOne(() => ProductCategory, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: ProductCategory;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductAddon, (addon) => addon.product)
  addons: ProductAddon[];
}
