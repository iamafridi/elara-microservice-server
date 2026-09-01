import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderStatus } from './order.entity';

@Entity('order_status_logs')
@Index(['orderId'])
@Index(['timestamp'])
export class OrderStatusLog extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status_enum'
  })
  status: OrderStatus;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  changedByUserId?: string;

  @ManyToOne(() => require('./order.entity').Order, (order: any) => order.statusLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: any;
}
