import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from './email.service';

@Processor('email-notifications')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    this.logger.log(`Processing email job ${job.id} to ${job.data.to}`);

    try {
      const result = await this.emailService.sendEmailDirect(job.data);
      this.logger.log(`Email sent successfully: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process email job ${job.id}`, error.stack);
      throw error;
    }
  }

  @Process('send-bulk-email')
  async handleSendBulkEmail(job: Job) {
    const { recipients } = job.data;
    this.logger.log(`Processing bulk email job ${job.id} for ${recipients.length} recipients`);

    try {
      const result = await this.emailService.sendBulkEmailDirect(job.data);
      this.logger.log(`Bulk email sent: ${result.sentCount} emails`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process bulk email job ${job.id}`, error.stack);
      throw error;
    }
  }

  @Process('send-template-email')
  async handleSendTemplateEmail(job: Job) {
    this.logger.log(`Processing template email job ${job.id} to ${job.data.to}`);

    try {
      const result = await this.emailService.sendTemplateEmailDirect(job.data);
      this.logger.log(`Template email sent successfully: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to process template email job ${job.id}`, error.stack);
      throw error;
    }
  }
}
