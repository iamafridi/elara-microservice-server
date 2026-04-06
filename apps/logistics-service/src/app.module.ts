import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { MapboxModule } from './mapbox/mapbox.module';
import { DeliveryModule } from './delivery/delivery.module';
import { RiderModule } from './rider/rider.module';
import { RouteModule } from './route/route.module';
import { TrackingModule } from './tracking/tracking.module';
import { RiderFeedModule } from './rider-feed/rider-feed.module';
import { ZoneModule } from './zone/zone.module';
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
    MapboxModule,
    DeliveryModule,
    RiderModule,
    RouteModule,
    TrackingModule,
    RiderFeedModule,
    ZoneModule,
  ],
})
export class AppModule {}
