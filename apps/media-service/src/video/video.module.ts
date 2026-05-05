import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { FfmpegService } from './ffmpeg.service';
import { Media } from '../../../../libs/database/src/entities/media.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    UploadModule,
  ],
  controllers: [VideoController],
  providers: [VideoService, FfmpegService],
  exports: [VideoService],
})
export class VideoModule {}
