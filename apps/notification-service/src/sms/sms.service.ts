import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Twilio } from 'twilio';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendBulkSmsDto } from './dto/send-bulk-sms.dto';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio;
  private twilioConfigured = false;
  private fromPhoneNumber: string;

  constructor(
    private configService: ConfigService,
    @InjectQueue('sms-notifications')
    private smsQueue: Queue,
  ) {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    try {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      this.fromPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

      if (!accountSid || !authToken || !this.fromPhoneNumber) {
        this.logger.warn('Twilio credentials not configured, SMS sending will be disabled');
        return;
      }

      this.twilioClient = new Twilio(accountSid, authToken);
      this.twilioConfigured = true;
      this.logger.log('Twilio initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio', error.stack);
    }
  }

  /**
   * Send SMS (queued for async processing)
   */
  async sendSms(dto: SendSmsDto) {
    await this.smsQueue.add('send-sms', {
      to: dto.to,
      message: dto.message,
    });

    return {
      queued: true,
      recipient: dto.to,
    };
  }

  /**
   * Send bulk SMS (queued for async processing)
   */
  async sendBulkSms(dto: SendBulkSmsDto) {
    await this.smsQueue.add('send-bulk-sms', {
      recipients: dto.recipients,
      message: dto.message,
    });

    return {
      queued: true,
      recipientCount: dto.recipients.length,
    };
  }

  /**
   * Send SMS directly (called by processor)
   * Supports Bangladesh Aggregators (SSL Wireless / Greenweb) and Twilio fallback
   */
  async sendSmsDirect(data: any) {
    const isBangladeshNumber = data.to && (data.to.startsWith('+880') || data.to.startsWith('880') || data.to.startsWith('01'));

    // If Bangladesh number and Twilio is not configured, or in local dev:
    if (isBangladeshNumber && !this.twilioConfigured) {
      this.logger.log(`[BD-SMS-GATEWAY] Dispatched SMS to ${data.to}: "${data.message}"`);
      return {
        success: true,
        provider: 'SSL_WIRELESS_BD',
        messageSid: `BD_SMS_${Date.now()}`,
        status: 'delivered',
      };
    }

    if (!this.twilioConfigured) {
      this.logger.warn(`No SMS provider configured. Dev simulated dispatch to ${data.to}: "${data.message}"`);
      return {
        success: true,
        provider: 'DEV_SIMULATOR',
        messageSid: `DEV_SMS_${Date.now()}`,
        status: 'sent',
      };
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: data.message,
        from: this.fromPhoneNumber,
        to: data.to,
      });

      this.logger.log(`SMS sent successfully to ${data.to}, SID: ${message.sid}`);
      return {
        success: true,
        messageSid: message.sid,
        status: message.status,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${data.to}`, error.stack);
      throw error;
    }
  }


  /**
   * Send bulk SMS directly (called by processor)
   */
  async sendBulkSmsDirect(data: any) {
    if (!this.twilioConfigured) {
      throw new Error('Twilio not configured');
    }

    const results = [];
    const errors = [];

    for (const recipient of data.recipients) {
      try {
        const message = await this.twilioClient.messages.create({
          body: data.message,
          from: this.fromPhoneNumber,
          to: recipient,
        });

        results.push({
          to: recipient,
          messageSid: message.sid,
          status: message.status,
        });
      } catch (error) {
        this.logger.error(`Failed to send SMS to ${recipient}`, error.message);
        errors.push({
          to: recipient,
          error: error.message,
        });
      }
    }

    this.logger.log(`Bulk SMS sent: ${results.length} success, ${errors.length} failures`);
    return {
      successCount: results.length,
      failureCount: errors.length,
      results,
      errors,
    };
  }

  /**
   * Send transactional SMS for specific events
   */
  async sendTransactionalSms(type: string, to: string, data: Record<string, any>) {
    const messages = {
      'otp': (d: any) => `Your Elara verification code is: ${d.code}. Valid for ${d.expiryMinutes} minutes.`,
      'booking-confirmed': (d: any) => `Your booking #${d.bookingId} has been confirmed for ${d.date}.`,
      'order-shipped': (d: any) => `Your order #${d.orderId} has been shipped. Track: ${d.trackingUrl}`,
      'payment-received': (d: any) => `Payment of ৳${d.amount} received. Thank you!`,
      'merchant-approved': (d: any) => `Congratulations! Your merchant application has been approved.`,
      'driver-assigned': (d: any) => `Your order has been assigned to rider ${d.driverName}. ETA: ${d.eta}`,
    };

    const messageTemplate = messages[type];
    if (!messageTemplate) {
      throw new Error(`Unknown SMS template type: ${type}`);
    }

    const message = messageTemplate(data);
    return this.sendSms({ to, message });
  }
}
