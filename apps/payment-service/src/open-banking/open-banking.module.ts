import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OpenBankingController } from './open-banking.controller';
import { OpenBankingService } from './open-banking.service';
import { TrueLayerService } from './truelayer.service';
import { Transaction } from '../../../../libs/database/src/entities/transaction.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { Wallet } from '../../../../libs/database/src/entities/wallet.entity';
import { WalletTransaction } from '../../../../libs/database/src/entities/wallet-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Order, Job, Wallet, WalletTransaction]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [OpenBankingController],
  providers: [OpenBankingService, TrueLayerService],
  exports: [OpenBankingService, TrueLayerService],
})
export class OpenBankingModule {}
