import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { JobCategory } from '../../../../libs/database/src/entities/job-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobCategory])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
