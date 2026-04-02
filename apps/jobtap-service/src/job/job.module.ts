import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { JobCategory } from '../../../../libs/database/src/entities/job-category.entity';
import { User } from '../../../../libs/database/src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobCategory, User])],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
