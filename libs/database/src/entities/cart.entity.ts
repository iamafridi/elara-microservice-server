import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ModuleType } from './order.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
@Index(['userId'])
export class Cart extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: ModuleType })
  moduleType: ModuleType;

  @Column({ type: 'uuid', nullable: true })
  merchantId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @OneToMany(() => CartItem, (item) => item.cart)
  items: CartItem[];
}
