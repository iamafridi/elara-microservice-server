import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { FcmController } from './fcm.controller';
import { FcmService } from './fcm.service';
import { FcmProcessor } from './fcm.processor';
import { NotificationToken } from '../../../../libs/database/src/entities/notification-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationToken]),
    BullModule.registerQueue({
      name: 'fcm-notifications',
    }),
  ],
  controllers: [FcmController],
  providers: [FcmService, FcmProcessor],
  exports: [FcmService],
})
export class FcmModule {}
