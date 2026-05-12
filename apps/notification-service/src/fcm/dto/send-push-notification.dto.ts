import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';

export class SendPushNotificationDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body: string;

  @ApiProperty({ description: 'Image URL', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'Badge count for iOS', required: false })
  @IsNumber()
  @IsOptional()
  badge?: number;

  @ApiProperty({ description: 'Additional data payload', required: false })
  @IsObject()
  @IsOptional()
  data?: Record<string, string>;
}
