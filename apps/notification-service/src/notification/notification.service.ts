import { Injectable, Logger } from '@nestjs/common';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

interface UserPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  orderNotifications: boolean;
  bookingNotifications: boolean;
  paymentNotifications: boolean;
  marketingNotifications: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  // In-memory storage (can be moved to database later)
  private preferences: Map<string, UserPreferences> = new Map();

  /**
   * Get user notification preferences
   */
  getUserPreferences(userId: string): UserPreferences {
    let prefs = this.preferences.get(userId);

    if (!prefs) {
      // Default preferences
      prefs = {
        userId,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: true,
        orderNotifications: true,
        bookingNotifications: true,
        paymentNotifications: true,
        marketingNotifications: false,
      };
      this.preferences.set(userId, prefs);
    }

    return prefs;
  }

  /**
   * Update user notification preferences
   */
  updateUserPreferences(userId: string, dto: UpdatePreferencesDto): UserPreferences {
    const currentPrefs = this.getUserPreferences(userId);

    const updatedPrefs: UserPreferences = {
      ...currentPrefs,
      ...dto,
    };

    this.preferences.set(userId, updatedPrefs);
    this.logger.log(`Updated notification preferences for user ${userId}`);

    return updatedPrefs;
  }

  /**
   * Check if user has enabled a specific notification channel
   */
  isChannelEnabled(userId: string, channel: 'push' | 'email' | 'sms'): boolean {
    const prefs = this.getUserPreferences(userId);

    switch (channel) {
      case 'push':
        return prefs.pushEnabled;
      case 'email':
        return prefs.emailEnabled;
      case 'sms':
        return prefs.smsEnabled;
      default:
        return false;
    }
  }

  /**
   * Check if user has enabled a specific notification type
   */
  isNotificationTypeEnabled(
    userId: string,
    type: 'order' | 'booking' | 'payment' | 'marketing',
  ): boolean {
    const prefs = this.getUserPreferences(userId);

    switch (type) {
      case 'order':
        return prefs.orderNotifications;
      case 'booking':
        return prefs.bookingNotifications;
      case 'payment':
        return prefs.paymentNotifications;
      case 'marketing':
        return prefs.marketingNotifications;
      default:
        return false;
    }
  }

  /**
   * Reset user preferences to default
   */
  resetUserPreferences(userId: string): UserPreferences {
    this.preferences.delete(userId);
    return this.getUserPreferences(userId);
  }
}
