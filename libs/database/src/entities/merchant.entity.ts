import { Entity, Column, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { MerchantCategory } from './merchant-category.entity';
import { Product } from './product.entity';
import { MerchantHour } from './merchant-hour.entity';

export enum MerchantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum OpenStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  BUSY = 'busy',
}

@Entity('merchants')
@Index(['userId'])
@Index(['slug'])
@Index(['categoryId'])
@Index(['status'])
@Index(['latitude', 'longitude'])
export class Merchant extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  storeName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage?: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 20 })
  postcode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  deliveryRadiusKm: number;

  @Column({ type: 'enum', enum: MerchantStatus, default: MerchantStatus.PENDING })
  status: MerchantStatus;

  @Column({ type: 'int', default: 30 })
  prepTimeMinutes: number;

  @Column({ type: 'boolean', default: false })
  autoAccept: boolean;

  @Column({ type: 'boolean', default: false })
  printerMode: boolean;

  @Column({ type: 'enum', enum: OpenStatus, default: OpenStatus.CLOSED })
  openStatus: OpenStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  commissionPercent: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'jsonb', nullable: true })
  bankDetails?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeAccountId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  owner: User;

  @ManyToOne(() => MerchantCategory)
  @JoinColumn({ name: 'categoryId' })
  category: MerchantCategory;

  @OneToMany(() => Product, (product) => product.merchant)
  products: Product[];

  @OneToMany(() => MerchantHour, (hour) => hour.merchant)
  hours: MerchantHour[];
}
