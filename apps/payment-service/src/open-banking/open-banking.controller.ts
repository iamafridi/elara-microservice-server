import { Controller, Post, Get, Body, Param, Query, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { OpenBankingService } from './open-banking.service';
import { ConnectBankDto, BankConnectionCallbackDto } from './dto/connect-bank.dto';
import { InitiateOpenBankingPaymentDto } from './dto/initiate-payment.dto';
import { TrueLayerWebhookDto } from './dto/truelayer-webhook.dto';
import { TrueLayerService } from './truelayer.service';

@ApiTags('Open Banking')
@Controller('open-banking')
export class OpenBankingController {
  constructor(
    private readonly openBankingService: OpenBankingService,
    private readonly trueLayerService: TrueLayerService,
  ) {}

  @Post('connect')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate bank connection',
    description: 'Start the Open Banking flow to connect a user\'s bank account via TrueLayer'
  })
  @ApiResponse({
    status: 201,
    description: 'Authorization URL generated',
    schema: {
      example: {
        authorizationUrl: 'https://auth.truelayer.com/...',
        state: 'abc123',
        provider: 'truelayer'
      }
    }
  })
  async connectBank(@Body() dto: ConnectBankDto) {
    return await this.openBankingService.connectBank(dto);
  }

  @Post('callback')
  @ApiOperation({
    summary: 'Handle bank connection callback',
    description: 'Process the callback from TrueLayer after user authorizes bank connection'
  })
  @ApiResponse({
    status: 200,
    description: 'Bank connected successfully',
    schema: {
      example: {
        success: true,
        accountsCount: 2,
        accounts: [
          {
            id: 'acc_123',
            displayName: 'Personal Current Account',
            accountNumber: { number: '12345678', sort_code: '12-34-56' },
            currency: 'GBP',
            provider: 'Monzo'
          }
        ]
      }
    }
  })
  async handleCallback(@Body() dto: BankConnectionCallbackDto) {
    return await this.openBankingService.handleBankCallback(dto);
  }

  @Get('accounts/:userId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user\'s connected bank accounts',
    description: 'Retrieve list of bank accounts connected by the user'
  })
  @ApiResponse({
    status: 200,
    description: 'List of connected accounts',
    schema: {
      example: {
        accounts: [
          {
            id: 'acc_123',
            displayName: 'Personal Current Account',
            accountNumber: { number: '12345678', sort_code: '12-34-56' },
            currency: 'GBP',
            provider: 'Monzo'
          }
        ]
      }
    }
  })
  async getUserAccounts(@Param('userId') userId: string) {
    return await this.openBankingService.getUserBankAccounts(userId);
  }

  @Post('payment/initiate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate Open Banking payment',
    description: 'Start a payment flow using Open Banking (bank transfer via TrueLayer)'
  })
  @ApiResponse({
    status: 201,
    description: 'Payment initiated',
    schema: {
      example: {
        transactionId: 'txn_123',
        paymentId: 'pay_456',
        authorizationUrl: 'https://payment.truelayer.com/...',
        status: 'authorization_required',
        reference: 'ORD-ABC123'
      }
    }
  })
  async initiatePayment(@Body() dto: InitiateOpenBankingPaymentDto) {
    return await this.openBankingService.initiatePayment(dto);
  }

  @Get('payment/status/:transactionId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment status',
    description: 'Check the status of an Open Banking payment'
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status',
    schema: {
      example: {
        transactionId: 'txn_123',
        status: 'completed',
        amount: 50.00,
        paymentMethod: 'bank_transfer',
        createdAt: '2025-01-02T17:00:00Z'
      }
    }
  })
  async getPaymentStatus(
    @Param('transactionId') transactionId: string,
    @Query('userId') userId: string,
  ) {
    return await this.openBankingService.getPaymentStatus(transactionId, userId);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'TrueLayer webhook endpoint',
    description: 'Receive payment status updates from TrueLayer (internal use only)'
  })
  @ApiHeader({
    name: 'X-TL-Webhook-Signature',
    description: 'TrueLayer webhook signature for verification',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed',
    schema: {
      example: {
        received: true,
        status: 'completed'
      }
    }
  })
  async handleWebhook(
    @Body() webhookDto: TrueLayerWebhookDto,
    @Headers('x-tl-webhook-signature') signature: string,
    @Body() rawBody: any,
  ) {
    // Verify webhook signature (in production)
    // const webhookSecret = process.env.TRUELAYER_WEBHOOK_SECRET;
    // const isValid = this.trueLayerService.verifyWebhookSignature(
    //   JSON.stringify(rawBody),
    //   signature,
    //   webhookSecret,
    // );

    // if (!isValid) {
    //   throw new BadRequestException('Invalid webhook signature');
    // }

    return await this.openBankingService.handleWebhook(webhookDto);
  }
}
