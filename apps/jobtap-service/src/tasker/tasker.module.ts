import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskerController } from './tasker.controller';
import { TaskerService } from './tasker.service';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';
import { User } from '../../../../libs/database/src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskerProfile, User])],
  controllers: [TaskerController],
  providers: [TaskerService],
  exports: [TaskerService],
})
export class TaskerModule {}
