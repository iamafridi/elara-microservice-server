import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { SmsProcessor } from './sms.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sms-notifications',
    }),
  ],
  controllers: [SmsController],
  providers: [SmsService, SmsProcessor],
  exports: [SmsService],
})
export class SmsModule {}
