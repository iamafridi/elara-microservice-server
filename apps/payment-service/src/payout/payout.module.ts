import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { StripeModule } from '../stripe/stripe.module';
import { Payout } from '../../../../libs/database/src/entities/payout.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payout, Merchant, Rider, TaskerProfile]),
    StripeModule,
  ],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
