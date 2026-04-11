import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderController } from './rider.controller';
import { RiderService } from './rider.service';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { RiderLocation } from '../../../../libs/database/src/entities/rider-location.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rider, RiderLocation, Order])],
  controllers: [RiderController],
  providers: [RiderService],
  exports: [RiderService],
})
export class RiderModule {}
