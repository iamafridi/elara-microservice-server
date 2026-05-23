import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SmsService } from './sms.service';

@Processor('sms-notifications')
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(private smsService: SmsService) {}

  @Process('send-sms')
  async handleSendSms(job: Job) {
    this.logger.log(`Processing SMS job ${job.id} to ${job.data.to}`);

    try {
      const result = await this.smsService.sendSmsDirect(job.data);
      this.logger.log(`SMS sent successfully: ${result.messageSid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process SMS job ${job.id}`, error.stack);
      throw error;
    }
  }

  @Process('send-bulk-sms')
  async handleSendBulkSms(job: Job) {
    const { recipients } = job.data;
    this.logger.log(`Processing bulk SMS job ${job.id} for ${recipients.length} recipients`);

    try {
      const result = await this.smsService.sendBulkSmsDirect(job.data);
      this.logger.log(`Bulk SMS sent: ${result.successCount} success, ${result.failureCount} failures`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process bulk SMS job ${job.id}`, error.stack);
      throw error;
    }
  }
}
