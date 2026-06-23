import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobSearchController } from './job-search.controller';
import { JobSearchService } from './job-search.service';
import { Job } from '../../../../libs/database/src/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [JobSearchController],
  providers: [JobSearchService],
  exports: [JobSearchService],
})
export class JobSearchModule {}
