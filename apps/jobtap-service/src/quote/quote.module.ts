import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { JobQuote } from '../../../../libs/database/src/entities/job-quote.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobQuote, Job, TaskerProfile])],
  controllers: [QuoteController],
  providers: [QuoteService],
  exports: [QuoteService],
})
export class QuoteModule {}
