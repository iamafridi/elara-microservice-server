import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { OrderItem } from '../../../../libs/database/src/entities/order-item.entity';
import { OrderStatusLog } from '../../../../libs/database/src/entities/order-status-log.entity';
import { Product } from '../../../../libs/database/src/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderStatusLog, Product])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
