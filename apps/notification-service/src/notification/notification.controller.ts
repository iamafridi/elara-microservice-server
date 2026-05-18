import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('preferences/:userId')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'User preferences' })
  getUserPreferences(@Param('userId') userId: string) {
    return this.notificationService.getUserPreferences(userId);
  }

  @Put('preferences/:userId')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  updateUserPreferences(
    @Param('userId') userId: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notificationService.updateUserPreferences(userId, dto);
  }

  @Delete('preferences/:userId')
  @ApiOperation({ summary: 'Reset user notification preferences to default' })
  @ApiResponse({ status: 200, description: 'Preferences reset' })
  resetUserPreferences(@Param('userId') userId: string) {
    return this.notificationService.resetUserPreferences(userId);
  }
}
