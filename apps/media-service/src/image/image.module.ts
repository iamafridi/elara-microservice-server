import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { UploadModule } from '../upload/upload.module';
import { Media } from '../../../../libs/database/src/entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), UploadModule],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
