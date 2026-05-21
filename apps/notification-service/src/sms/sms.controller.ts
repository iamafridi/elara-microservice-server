import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendBulkSmsDto } from './dto/send-bulk-sms.dto';

@ApiTags('SMS')
@ApiBearerAuth()
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send SMS to a recipient' })
  @ApiResponse({ status: 200, description: 'SMS queued for sending' })
  sendSms(@Body() dto: SendSmsDto) {
    return this.smsService.sendSms(dto);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send SMS to multiple recipients' })
  @ApiResponse({ status: 200, description: 'Bulk SMS queued for sending' })
  sendBulkSms(@Body() dto: SendBulkSmsDto) {
    return this.smsService.sendBulkSms(dto);
  }

  @Post('transactional')
  @ApiOperation({ summary: 'Send transactional SMS' })
  @ApiResponse({ status: 200, description: 'Transactional SMS queued' })
  sendTransactionalSms(
    @Body() dto: { type: string; to: string; data: Record<string, any> },
  ) {
    return this.smsService.sendTransactionalSms(dto.type, dto.to, dto.data);
  }
}
