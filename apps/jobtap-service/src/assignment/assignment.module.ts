import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';
import { JobAssignment } from '../../../../libs/database/src/entities/job-assignment.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { JobQuote } from '../../../../libs/database/src/entities/job-quote.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobAssignment, Job, JobQuote, TaskerProfile])],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
