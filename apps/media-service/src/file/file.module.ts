import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { Media } from '../../../../libs/database/src/entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
