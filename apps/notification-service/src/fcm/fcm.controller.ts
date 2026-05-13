import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FcmService } from './fcm.service';
import { SendPushNotificationDto } from './dto/send-push-notification.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';

@ApiTags('FCM')
@ApiBearerAuth()
@Controller('fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  registerDevice(@Body() dto: RegisterDeviceDto) {
    return this.fcmService.registerDevice(dto);
  }

  @Delete('device')
  @ApiOperation({ summary: 'Remove device token' })
  @ApiResponse({ status: 200, description: 'Device token removed' })
  removeDevice(
    @Query('userId') userId: string,
    @Query('token') token: string,
  ) {
    return this.fcmService.removeDevice(userId, token);
  }

  @Post('send/:userId')
  @ApiOperation({ summary: 'Send push notification to a user' })
  @ApiResponse({ status: 200, description: 'Notification queued for sending' })
  sendToUser(
    @Param('userId') userId: string,
    @Body() dto: SendPushNotificationDto,
  ) {
    return this.fcmService.sendToUser(userId, dto);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send push notification to multiple users' })
  @ApiResponse({ status: 200, description: 'Notifications queued for sending' })
  sendToMultipleUsers(@Body() dto: { userIds: string[]; notification: SendPushNotificationDto }) {
    return this.fcmService.sendToMultipleUsers(dto.userIds, dto.notification);
  }

  @Get('devices/:userId')
  @ApiOperation({ summary: 'Get user device tokens' })
  @ApiResponse({ status: 200, description: 'List of user devices' })
  getUserDevices(@Param('userId') userId: string) {
    return this.fcmService.getUserDevices(userId);
  }
}
