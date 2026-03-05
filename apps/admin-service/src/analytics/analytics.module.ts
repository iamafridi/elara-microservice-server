import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../../libs/database/src/entities/user.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Product } from '../../../../libs/database/src/entities/product.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Transaction } from '../../../../libs/database/src/entities/transaction.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Order,
      Product,
      Merchant,
      Transaction,
      Job,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
