import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HealthModule } from './health/health.module';
import { FcmModule } from './fcm/fcm.module';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { NotificationModule } from './notification/notification.module';
import { TemplatesModule } from './templates/templates.module';
import { DatabaseConfigService } from '../../../libs/config/src/database-config.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService,
    }),

    // Bull Queue for async notifications
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),

    // Feature modules
    HealthModule,
    FcmModule,
    EmailModule,
    SmsModule,
    NotificationModule,
    TemplatesModule,
  ],
})
export class AppModule {}
