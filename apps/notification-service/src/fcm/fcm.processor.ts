import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FcmService } from './fcm.service';

@Processor('fcm-notifications')
export class FcmProcessor {
  private readonly logger = new Logger(FcmProcessor.name);

  constructor(private fcmService: FcmService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job) {
    const { tokens, notification } = job.data;

    this.logger.log(`Processing FCM notification job ${job.id} for ${tokens.length} tokens`);

    try {
      const result = await this.fcmService.sendNotification(tokens, notification);
      this.logger.log(`FCM notification sent: ${result.successCount} success, ${result.failureCount} failures`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process FCM notification job ${job.id}`, error.stack);
      throw error;
    }
  }
}
