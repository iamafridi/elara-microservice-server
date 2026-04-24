import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { UploadModule } from './upload/upload.module';
import { ImageModule } from './image/image.module';
import { VideoModule } from './video/video.module';
import { FileModule } from './file/file.module';
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
    UploadModule,
    ImageModule,
    VideoModule,
    FileModule,
  ],
})
export class AppModule {}
