import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { SendTemplateEmailDto } from './dto/send-template-email.dto';

@ApiTags('Email')
@ApiBearerAuth()
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send email to a recipient' })
  @ApiResponse({ status: 200, description: 'Email queued for sending' })
  sendEmail(@Body() dto: SendEmailDto) {
    return this.emailService.sendEmail(dto);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send email to multiple recipients' })
  @ApiResponse({ status: 200, description: 'Bulk emails queued for sending' })
  sendBulkEmail(@Body() dto: SendBulkEmailDto) {
    return this.emailService.sendBulkEmail(dto);
  }

  @Post('send-template')
  @ApiOperation({ summary: 'Send template-based email' })
  @ApiResponse({ status: 200, description: 'Template email queued for sending' })
  sendTemplateEmail(@Body() dto: SendTemplateEmailDto) {
    return this.emailService.sendTemplateEmail(dto);
  }

  @Post('transactional')
  @ApiOperation({ summary: 'Send transactional email' })
  @ApiResponse({ status: 200, description: 'Transactional email queued' })
  sendTransactionalEmail(
    @Body() dto: { type: string; to: string; data: Record<string, any> },
  ) {
    return this.emailService.sendTransactionalEmail(dto.type, dto.to, dto.data);
  }
}
