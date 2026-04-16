import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { RiderLocation } from '../../../../libs/database/src/entities/rider-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Rider, RiderLocation])],
  controllers: [RouteController],
  providers: [RouteService],
  exports: [RouteService],
})
export class RouteModule {}
