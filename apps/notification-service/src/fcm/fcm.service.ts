import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as admin from 'firebase-admin';
import { NotificationToken } from '../../../../libs/database/src/entities/notification-token.entity';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private firebaseApp: admin.app.App;

  constructor(
    private configService: ConfigService,
    @InjectRepository(NotificationToken)
    private deviceTokenRepository: Repository<NotificationToken>,
    @InjectQueue('fcm-notifications')
    private fcmQueue: Queue,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

      if (!serviceAccount) {
        this.logger.warn('FIREBASE_SERVICE_ACCOUNT not configured');
        return;
      }

      const serviceAccountJson = JSON.parse(serviceAccount);

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error.stack);
    }
  }

  /**
   * Register device token for push notifications
   */
  async registerDevice(dto: RegisterDeviceDto) {
    const existingToken = await this.deviceTokenRepository.findOne({
      where: {
        userId: dto.userId,
        fcmToken: dto.token,
      },
    });

    if (existingToken) {
      // Update existing token
      existingToken.platform = dto.platform as any;
      existingToken.deviceId = dto.deviceId;
      await this.deviceTokenRepository.save(existingToken);
      return existingToken;
    }

    // Create new token
    const deviceToken = this.deviceTokenRepository.create({
      userId: dto.userId,
      fcmToken: dto.token,
      platform: dto.platform as any,
      deviceId: dto.deviceId,
      isActive: true,
    });

    await this.deviceTokenRepository.save(deviceToken);
    return deviceToken;
  }

  /**
   * Remove device token
   */
  async removeDevice(userId: string, token: string) {
    await this.deviceTokenRepository.delete({
      userId,
      fcmToken: token,
    });

    return { deleted: true };
  }

  /**
   * Send push notification to a user
   */
  async sendToUser(userId: string, dto: SendPushNotificationDto) {
    const tokens = await this.deviceTokenRepository.find({
      where: {
        userId,
        isActive: true,
      },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return { sent: 0 };
    }

    // Add to queue for async processing
    await this.fcmQueue.add('send-notification', {
      tokens: tokens.map(t => t.fcmToken),
      notification: dto,
      userId,
    });

    return {
      sent: tokens.length,
      queued: true,
    };
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(userIds: string[], dto: SendPushNotificationDto) {
    const tokens = await this.deviceTokenRepository.find({
      where: {
        userId: userIds as any, // TypeORM In operator
        isActive: true,
      },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No active device tokens found for users`);
      return { sent: 0 };
    }

    // Add to queue for async processing
    await this.fcmQueue.add('send-notification', {
      tokens: tokens.map(t => t.fcmToken),
      notification: dto,
      userIds,
    });

    return {
      sent: tokens.length,
      queued: true,
    };
  }

  /**
   * Send push notification directly (called by processor)
   */
  async sendNotification(tokens: string[], dto: SendPushNotificationDto) {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: dto.title,
        body: dto.body,
        imageUrl: dto.imageUrl,
      },
      data: dto.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'elara-notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: dto.badge,
          },
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          this.logger.warn(`Failed to send to token ${tokens[idx]}: ${resp.error?.message}`);
        }
      });

      // Deactivate failed tokens
      if (failedTokens.length > 0) {
        await this.deviceTokenRepository.update(
          { fcmToken: failedTokens as any },
          { isActive: false },
        );
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      this.logger.error('Failed to send FCM notification', error.stack);
      throw error;
    }
  }

  /**
   * Get user's device tokens
   */
  async getUserDevices(userId: string) {
    return this.deviceTokenRepository.find({
      where: { userId, isActive: true },
    });
  }
}
