import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { RiderLocation } from '../../../../libs/database/src/entities/rider-location.entity';
import { MapboxModule } from '../mapbox/mapbox.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Rider, RiderLocation]),
    MapboxModule,
  ],
  controllers: [TrackingController],
  providers: [TrackingService, TrackingGateway],
  exports: [TrackingService, TrackingGateway],
})
export class TrackingModule {}
