import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Cart } from './cart.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('cart_items')
@Index(['cartId'])
@Index(['productId'])
export class CartItem extends BaseEntity {
  @Column({ type: 'uuid' })
  cartId: string;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  variantId?: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'jsonb', nullable: true })
  addons?: Record<string, any>[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  specialInstructions?: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;
}
