import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsObject, IsArray } from 'class-validator';

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  ALL = 'all',
}

export class SendNotificationDto {
  @ApiProperty({ description: 'User ID to send notification to' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Notification template type' })
  @IsString()
  templateType: string;

  @ApiProperty({
    description: 'Notification channels',
    enum: NotificationChannel,
    isArray: true,
    required: false
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @ApiProperty({ description: 'Template variables', required: false })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
