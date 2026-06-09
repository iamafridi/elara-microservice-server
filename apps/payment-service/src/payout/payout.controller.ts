import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PayoutService } from './payout.service';
import { CreatePayoutDto } from './dto/create-payout.dto';

@ApiTags('Payouts')
@ApiBearerAuth()
@Controller('payouts')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Post()
  @ApiOperation({ summary: 'Create payout to merchant/rider/tasker' })
  @ApiResponse({ status: 201, description: 'Payout created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Recipient not found' })
  createPayout(@Body() dto: CreatePayoutDto) {
    return this.payoutService.createPayout(dto);
  }

  @Get(':payoutId')
  @ApiOperation({ summary: 'Get payout by ID' })
  @ApiResponse({ status: 200, description: 'Payout details' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  getPayout(@Param('payoutId') payoutId: string) {
    return this.payoutService.getPayout(payoutId);
  }

  @Get(':recipientType/:recipientId')
  @ApiOperation({ summary: 'Get payouts for recipient' })
  @ApiParam({
    name: 'recipientType',
    enum: ['merchant', 'rider', 'tasker'],
  })
  @ApiResponse({ status: 200, description: 'List of payouts' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  getRecipientPayouts(
    @Param('recipientType') recipientType: 'merchant' | 'rider' | 'tasker',
    @Param('recipientId') recipientId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.payoutService.getRecipientPayouts(
      recipientType,
      recipientId,
      limit,
      offset,
    );
  }

  @Get(':recipientType/:recipientId/earnings')
  @ApiOperation({ summary: 'Get total earnings for recipient' })
  @ApiParam({
    name: 'recipientType',
    enum: ['merchant', 'rider', 'tasker'],
  })
  @ApiResponse({ status: 200, description: 'Total earnings' })
  getRecipientEarnings(
    @Param('recipientType') recipientType: 'merchant' | 'rider' | 'tasker',
    @Param('recipientId') recipientId: string,
  ) {
    return this.payoutService.getRecipientEarnings(recipientType, recipientId);
  }

  @Post(':payoutId/retry')
  @ApiOperation({ summary: 'Retry failed payout' })
  @ApiResponse({ status: 200, description: 'Payout retried successfully' })
  @ApiResponse({ status: 400, description: 'Can only retry failed payouts' })
  retryPayout(@Param('payoutId') payoutId: string) {
    return this.payoutService.retryPayout(payoutId);
  }
}
