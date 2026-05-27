import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { PaymentModule } from './payment/payment.module';
import { StripeModule } from './stripe/stripe.module';
import { WalletModule } from './wallet/wallet.module';
import { PayoutModule } from './payout/payout.module';
import { OpenBankingModule } from './open-banking/open-banking.module';
import { DatabaseConfigService } from '../../../libs/config/src/database-config.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService,
    }),

    // Feature modules
    HealthModule,
    PaymentModule,
    StripeModule,
    WalletModule,
    PayoutModule,
    OpenBankingModule,
  ],
})
export class AppModule {}
