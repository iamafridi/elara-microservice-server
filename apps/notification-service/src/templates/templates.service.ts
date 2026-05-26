import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmService } from '../fcm/fcm.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { User } from '../../../../libs/database/src/entities/user.entity';
import { SendNotificationDto, NotificationChannel } from './dto/send-notification.dto';

interface NotificationTemplate {
  type: string;
  push?: {
    title: string;
    body: string;
    data?: Record<string, string>;
  };
  email?: {
    subject: string;
    templateId?: string;
  };
  sms?: {
    message: string;
  };
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  // In-memory template storage (can be moved to database later)
  private templates: Map<string, NotificationTemplate> = new Map([
    ['order-placed', {
      type: 'order-placed',
      push: {
        title: 'Order Placed',
        body: 'Your order #{{orderId}} has been placed successfully',
        data: { type: 'order' },
      },
      email: {
        subject: 'Order Confirmation - #{{orderId}}',
        templateId: 'd-order-confirmation',
      },
      sms: {
        message: 'Your Elara order #{{orderId}} has been placed. Total: ৳{{amount}}',
      },
    }],
    ['order-shipped', {
      type: 'order-shipped',
      push: {
        title: 'Order Shipped',
        body: 'Your order #{{orderId}} is on the way!',
        data: { type: 'order' },
      },
      email: {
        subject: 'Order Shipped - #{{orderId}}',
        templateId: 'd-order-shipped',
      },
      sms: {
        message: 'Your order #{{orderId}} has been shipped. Track: {{trackingUrl}}',
      },
    }],
    ['booking-confirmed', {
      type: 'booking-confirmed',
      push: {
        title: 'Booking Confirmed',
        body: 'Your booking for {{serviceName}} is confirmed',
        data: { type: 'booking' },
      },
      email: {
        subject: 'Booking Confirmation - {{serviceName}}',
        templateId: 'd-booking-confirmed',
      },
      sms: {
        message: 'Your booking #{{bookingId}} for {{serviceName}} is confirmed for {{date}}',
      },
    }],
    ['payment-received', {
      type: 'payment-received',
      push: {
        title: 'Payment Received',
        body: 'Payment of ৳{{amount}} has been received',
        data: { type: 'payment' },
      },
      email: {
        subject: 'Payment Receipt - ৳{{amount}}',
        templateId: 'd-payment-received',
      },
      sms: {
        message: 'Payment of ৳{{amount}} received. Thank you!',
      },
    }],
    ['merchant-approved', {
      type: 'merchant-approved',
      push: {
        title: 'Application Approved',
        body: 'Congratulations! Your merchant application has been approved',
        data: { type: 'merchant' },
      },
      email: {
        subject: 'Merchant Application Approved',
        templateId: 'd-merchant-approved',
      },
      sms: {
        message: 'Congratulations! Your Elara merchant application has been approved.',
      },
    }],
    ['welcome', {
      type: 'welcome',
      push: {
        title: 'Welcome to Elara!',
        body: 'Thanks for joining Elara, {{name}}!',
        data: { type: 'welcome' },
      },
      email: {
        subject: 'Welcome to Elara!',
        templateId: 'd-welcome',
      },
    }],
  ]);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private fcmService: FcmService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  /**
   * Send notification using template
   */
  async sendNotification(dto: SendNotificationDto) {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    const template = this.templates.get(dto.templateType);
    if (!template) {
      throw new NotFoundException(`Template ${dto.templateType} not found`);
    }

    const channels = dto.channels || [NotificationChannel.ALL];
    const results = {
      push: null,
      email: null,
      sms: null,
    };

    // Determine which channels to use
    const shouldSendPush = channels.includes(NotificationChannel.ALL) || channels.includes(NotificationChannel.PUSH);
    const shouldSendEmail = channels.includes(NotificationChannel.ALL) || channels.includes(NotificationChannel.EMAIL);
    const shouldSendSms = channels.includes(NotificationChannel.ALL) || channels.includes(NotificationChannel.SMS);

    // Send push notification
    if (shouldSendPush && template.push) {
      try {
        const pushData = this.interpolateTemplate(template.push, dto.data || {});
        results.push = await this.fcmService.sendToUser(dto.userId, {
          title: pushData.title,
          body: pushData.body,
          data: pushData.data,
        });
        this.logger.log(`Push notification sent to user ${dto.userId}`);
      } catch (error) {
        this.logger.error(`Failed to send push notification`, error.stack);
      }
    }

    // Send email
    if (shouldSendEmail && template.email && user.email) {
      try {
        const emailData = this.interpolateTemplate(template.email, dto.data || {});
        if (emailData.templateId) {
          results.email = await this.emailService.sendTemplateEmail({
            to: user.email,
            templateId: emailData.templateId,
            variables: dto.data,
          });
        } else {
          results.email = await this.emailService.sendEmail({
            to: user.email,
            subject: emailData.subject,
            html: `<p>${emailData.subject}</p>`,
          });
        }
        this.logger.log(`Email sent to ${user.email}`);
      } catch (error) {
        this.logger.error(`Failed to send email`, error.stack);
      }
    }

    // Send SMS
    if (shouldSendSms && template.sms && user.phone) {
      try {
        const smsData = this.interpolateTemplate(template.sms, dto.data || {});
        results.sms = await this.smsService.sendSms({
          to: user.phone,
          message: smsData.message,
        });
        this.logger.log(`SMS sent to ${user.phone}`);
      } catch (error) {
        this.logger.error(`Failed to send SMS`, error.stack);
      }
    }

    return {
      userId: dto.userId,
      templateType: dto.templateType,
      channels: channels,
      results,
    };
  }

  /**
   * Interpolate template variables
   */
  private interpolateTemplate<T>(template: T, data: Record<string, any>): T {
    const json = JSON.stringify(template);
    const interpolated = json.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
    return JSON.parse(interpolated);
  }

  /**
   * Get all available templates
   */
  getTemplates() {
    return Array.from(this.templates.values()).map(t => ({
      type: t.type,
      channels: {
        push: !!t.push,
        email: !!t.email,
        sms: !!t.sms,
      },
    }));
  }

  /**
   * Get template by type
   */
  getTemplate(type: string) {
    const template = this.templates.get(type);
    if (!template) {
      throw new NotFoundException(`Template ${type} not found`);
    }
    return template;
  }
}
