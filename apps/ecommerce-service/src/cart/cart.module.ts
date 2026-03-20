import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from '../../../../libs/database/src/entities/cart.entity';
import { CartItem } from '../../../../libs/database/src/entities/cart-item.entity';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { ProductVariant } from '../../../../libs/database/src/entities/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product, ProductVariant])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
