import { Entity, Column, ManyToOne, OneToMany, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Merchant } from './merchant.entity';
import { Rider } from './rider.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusLog } from './order-status-log.entity';

export enum ModuleType {
  FOOD = 'food',
  GROCERY = 'grocery',
  PARCEL = 'parcel',
  HALAL = 'halal',
  FLOWERS = 'flowers',
  FISH = 'fish',
  FASHION = 'fashion',
  ELECTRONICS = 'electronics',
  HEALTH = 'health',
  RIDE = 'ride',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('orders')
@Index(['orderNumber'])
@Index(['userId'])
@Index(['merchantId'])
@Index(['riderId'])
@Index(['status'])
@Index(['moduleType'])
@Index(['createdAt'])
export class Order extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  merchantId?: string;

  @Column({ type: 'uuid', nullable: true })
  riderId?: string;

  @Column({ type: 'enum', enum: ModuleType })
  moduleType: ModuleType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  commissionPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  vatAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentIntentId?: string;

  @Column({ type: 'varchar', length: 500 })
  deliveryAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  deliveryLongitude: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deliveryNotes?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerName?: string;

  @Column({ type: 'int', nullable: true })
  estimatedPrepTimeMinutes?: number;

  @Column({ type: 'int', nullable: true })
  estimatedDeliveryTimeMinutes?: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pickedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancellationReason?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  promoCode?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  customer: User;

  @ManyToOne(() => Merchant, { nullable: true })
  @JoinColumn({ name: 'merchantId' })
  merchant?: Merchant;

  @ManyToOne(() => Rider, { nullable: true })
  @JoinColumn({ name: 'riderId' })
  rider?: Rider;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => OrderStatusLog, (log) => log.order)
  statusLogs: OrderStatusLog[];
}
