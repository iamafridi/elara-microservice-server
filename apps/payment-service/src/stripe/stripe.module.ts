import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant, Rider, TaskerProfile])],
  controllers: [StripeController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
