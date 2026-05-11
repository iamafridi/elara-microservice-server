import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
// import * as sgMail from '@sendgrid/mail'; // Commented out: Using Gmail SMTP instead
import * as nodemailer from 'nodemailer';
import { SendEmailDto } from './dto/send-email.dto';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { SendTemplateEmailDto } from './dto/send-template-email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private gmailConfigured = false;
  private transporter: nodemailer.Transporter;
  private defaultFromEmail: string;
  private defaultFromName: string;

  constructor(
    private configService: ConfigService,
    @InjectQueue('email-notifications')
    private emailQueue: Queue,
  ) {
    this.initializeGmailTransporter();
  }

  private initializeGmailTransporter() {
    try {
      const gmailEmail = this.configService.get<string>('GMAIL_EMAIL');
      const gmailPassword = this.configService.get<string>('GMAIL_PASSWORD');
      this.defaultFromEmail = this.configService.get<string>('EMAIL_FROM_ADDRESS') || 'noreply@elara.com.bd';
      this.defaultFromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Elara';

      if (!gmailEmail || !gmailPassword) {
        this.logger.warn('GMAIL_EMAIL or GMAIL_PASSWORD not configured, email sending will be disabled');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use STARTTLS
        auth: {
          user: gmailEmail,
          pass: gmailPassword,
        },
      });

      this.gmailConfigured = true;
      this.logger.log('Gmail SMTP initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Gmail SMTP', error.stack);
    }
  }

  /**
   * Send email (queued for async processing)
   */
  async sendEmail(dto: SendEmailDto) {
    await this.emailQueue.add('send-email', {
      to: dto.to,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
      replyTo: dto.replyTo,
      cc: dto.cc,
      bcc: dto.bcc,
      attachments: dto.attachments,
    });

    return {
      queued: true,
      recipient: dto.to,
    };
  }

  /**
   * Send bulk emails (queued for async processing)
   */
  async sendBulkEmail(dto: SendBulkEmailDto) {
    await this.emailQueue.add('send-bulk-email', {
      recipients: dto.recipients,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
      replyTo: dto.replyTo,
    });

    return {
      queued: true,
      recipientCount: dto.recipients.length,
    };
  }

  /**
   * Send template-based email (queued for async processing)
   */
  async sendTemplateEmail(dto: SendTemplateEmailDto) {
    await this.emailQueue.add('send-template-email', {
      to: dto.to,
      templateId: dto.templateId,
      variables: dto.variables,
      replyTo: dto.replyTo,
    });

    return {
      queued: true,
      recipient: dto.to,
      template: dto.templateId,
    };
  }

  /**
   * Send email directly (called by processor)
   */
  async sendEmailDirect(data: any) {
    if (!this.gmailConfigured) {
      throw new Error('Gmail not configured');
    }

    const mailOptions: nodemailer.SendMailOptions = {
      to: data.to,
      from: `${this.defaultFromName} <${this.defaultFromEmail}>`,
      subject: data.subject,
      text: data.text,
      html: data.html,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
    };

    // Handle attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      mailOptions.attachments = data.attachments.map((url: string) => ({
        filename: url.split('/').pop() || 'attachment',
        path: url,
      }));
    }

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${data.to}`);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.to}`, error.stack);
      throw error;
    }
  }

  /**
   * Send bulk emails directly (called by processor)
   */
  async sendBulkEmailDirect(data: any) {
    if (!this.gmailConfigured) {
      throw new Error('Gmail not configured');
    }

    let sentCount = 0;
    const results = [];

    for (const recipient of data.recipients) {
      try {
        const mailOptions: nodemailer.SendMailOptions = {
          to: recipient,
          from: `${this.defaultFromName} <${this.defaultFromEmail}>`,
          subject: data.subject,
          text: data.text,
          html: data.html,
          replyTo: data.replyTo,
        };

        const result = await this.transporter.sendMail(mailOptions);
        sentCount++;
        results.push({
          recipient,
          success: true,
          messageId: result.messageId,
        });
      } catch (error) {
        this.logger.error(`Failed to send bulk email to ${recipient}`, error.stack);
        results.push({
          recipient,
          success: false,
          error: error.message,
        });
      }
    }

    this.logger.log(`Bulk email sent to ${sentCount}/${data.recipients.length} recipients`);
    return {
      success: sentCount > 0,
      sentCount,
      totalCount: data.recipients.length,
      results,
    };
  }

  /**
   * Send template email directly (called by processor)
   */
  async sendTemplateEmailDirect(data: any) {
    if (!this.gmailConfigured) {
      throw new Error('Gmail not configured');
    }

    // Generate HTML from template with variable interpolation
    const html = this.buildEmailTemplate(data.templateId, data.variables || {});

    const mailOptions: nodemailer.SendMailOptions = {
      to: data.to,
      from: `${this.defaultFromName} <${this.defaultFromEmail}>`,
      subject: this.getTemplateSubject(data.templateId),
      html,
      replyTo: data.replyTo,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Template email sent successfully to ${data.to} using template ${data.templateId}`);
      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      this.logger.error(`Failed to send template email to ${data.to}`, error.stack);
      throw error;
    }
  }

  /**
   * Build email template with variable interpolation
   */
  private buildEmailTemplate(templateId: string, variables: Record<string, any>): string {
    const templates: Record<string, string> = {
      'welcome': `
        <h1>Welcome to Elara!</h1>
        <p>Hi ${variables.name || 'User'},</p>
        <p>Thank you for joining Elara. We're excited to have you on board.</p>
        <p>Get started by completing your profile and exploring our services.</p>
      `,
      'password-reset': `
        <h1>Password Reset Request</h1>
        <p>Hi ${variables.name || 'User'},</p>
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <p><a href="${variables.resetLink || '#'}">Reset Password</a></p>
        <p>This link expires in 24 hours.</p>
      `,
      'order-confirmation': `
        <h1>Order Confirmation</h1>
        <p>Hi ${variables.name || 'User'},</p>
        <p>Your order #${variables.orderId || 'N/A'} has been confirmed.</p>
        <p>Total: ${variables.total || 'N/A'}</p>
        <p>Track your order here: <a href="${variables.trackingLink || '#'}">View Order</a></p>
      `,
      'booking-confirmation': `
        <h1>Booking Confirmation</h1>
        <p>Hi ${variables.name || 'User'},</p>
        <p>Your booking #${variables.bookingId || 'N/A'} is confirmed.</p>
        <p>Date: ${variables.date || 'N/A'}</p>
        <p>Time: ${variables.time || 'N/A'}</p>
      `,
      'payment-received': `
        <h1>Payment Received</h1>
        <p>Hi ${variables.name || 'User'},</p>
        <p>We've received your payment of ${variables.amount || 'N/A'}.</p>
        <p>Transaction ID: ${variables.transactionId || 'N/A'}</p>
      `,
      'payment-failed': `
        <h1>Payment Failed</h1>
        <p>Hi ${variables.name || 'User'},</p>
        <p>Your payment attempt failed. Please try again.</p>
        <p>Error: ${variables.errorMessage || 'N/A'}</p>
      `,
      'merchant-approved': `
        <h1>Merchant Account Approved</h1>
        <p>Hi ${variables.name || 'Merchant'},</p>
        <p>Congratulations! Your merchant account has been approved.</p>
        <p>You can now start accepting orders on Elara.</p>
      `,
      'merchant-rejected': `
        <h1>Merchant Account Application</h1>
        <p>Hi ${variables.name || 'Merchant'},</p>
        <p>Thank you for your application. Unfortunately, we could not approve it at this time.</p>
        <p>Reason: ${variables.reason || 'N/A'}</p>
      `,
    };

    return templates[templateId] || `<p>Email from Elara</p>`;
  }

  /**
   * Get subject line for template
   */
  private getTemplateSubject(templateId: string): string {
    const subjects: Record<string, string> = {
      'welcome': 'Welcome to Elara!',
      'password-reset': 'Reset Your Password',
      'order-confirmation': 'Order Confirmation',
      'booking-confirmation': 'Booking Confirmation',
      'payment-received': 'Payment Received',
      'payment-failed': 'Payment Failed',
      'merchant-approved': 'Merchant Account Approved',
      'merchant-rejected': 'Application Status',
    };

    return subjects[templateId] || 'Message from Elara';
  }

  /**
   * Send transactional email for specific events
   */
  async sendTransactionalEmail(type: string, to: string, data: Record<string, any>) {
    const validTemplateTypes = [
      'welcome',
      'password-reset',
      'order-confirmation',
      'booking-confirmation',
      'payment-received',
      'payment-failed',
      'merchant-approved',
      'merchant-rejected',
    ];

    if (!validTemplateTypes.includes(type)) {
      throw new Error(`Unknown email template type: ${type}`);
    }

    return this.sendTemplateEmail({
      to,
      templateId: type,
      variables: data,
    });
  }
}
