import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeModule } from '../stripe/stripe.module';
import { Transaction } from '../../../../libs/database/src/entities/transaction.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { Wallet } from '../../../../libs/database/src/entities/wallet.entity';
import { WalletTransaction } from '../../../../libs/database/src/entities/wallet-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Order,
      Job,
      Wallet,
      WalletTransaction,
    ]),
    StripeModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
