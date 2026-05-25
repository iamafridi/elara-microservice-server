import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Notification Templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send notification using template' })
  @ApiResponse({ status: 200, description: 'Notification sent across channels' })
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.templatesService.sendNotification(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available notification templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  getTemplates() {
    return this.templatesService.getTemplates();
  }

  @Get(':type')
  @ApiOperation({ summary: 'Get template by type' })
  @ApiResponse({ status: 200, description: 'Template details' })
  getTemplate(@Param('type') type: string) {
    return this.templatesService.getTemplate(type);
  }
}
