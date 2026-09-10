import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Rider } from './rider.entity';
import { Order } from './order.entity';

@Entity('rider_earnings')
@Index(['riderId'])
@Index(['orderId'])
@Index(['createdAt'])
export class RiderEarning extends BaseEntity {
  @Column({ type: 'uuid' })
  riderId: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  distanceFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  surgeBonus: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tips: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @ManyToOne(() => Rider, (rider) => rider.earnings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'riderId' })
  rider: Rider;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order?: Order;
}
