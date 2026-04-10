import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MapboxService } from './mapbox.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MapboxService],
  exports: [MapboxService],
})
export class MapboxModule {}
