import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoneController } from './zone.controller';
import { ZoneService } from './zone.service';
import { Zone } from '../../../../libs/database/src/entities/zone.entity';
import { ZoneModule as ZoneModuleEntity } from '../../../../libs/database/src/entities/zone-module.entity';
import { RiderZone } from '../../../../libs/database/src/entities/rider-zone.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Zone,
      ZoneModuleEntity,
      RiderZone,
      Rider,
    ]),
  ],
  controllers: [ZoneController],
  providers: [ZoneService],
  exports: [ZoneService],
})
export class ZoneModule {}
