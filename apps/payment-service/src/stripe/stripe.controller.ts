import { Controller, Post, Get, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { CreateConnectAccountDto } from './dto/create-connect-account.dto';
import { UpdateConnectAccountDto } from './dto/update-connect-account.dto';

@ApiTags('Stripe Connect')
@ApiBearerAuth()
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('connect/account')
  @ApiOperation({ summary: 'Create Stripe Connect account' })
  @ApiResponse({ status: 201, description: 'Connect account created with onboarding URL' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createConnectAccount(@Body() dto: CreateConnectAccountDto) {
    return this.stripeService.createConnectAccount(dto);
  }

  @Get('connect/account/:accountId')
  @ApiOperation({ summary: 'Get Connect account details' })
  @ApiResponse({ status: 200, description: 'Account details retrieved' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  getConnectAccount(@Param('accountId') accountId: string) {
    return this.stripeService.getConnectAccount(accountId);
  }

  @Patch('connect/account/:accountId')
  @ApiOperation({ summary: 'Update Connect account' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  updateConnectAccount(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateConnectAccountDto,
  ) {
    return this.stripeService.updateConnectAccount(accountId, dto);
  }

  @Post('connect/account-link/:accountId')
  @ApiOperation({ summary: 'Create account link for onboarding/updates' })
  @ApiResponse({ status: 201, description: 'Account link created' })
  createAccountLink(
    @Param('accountId') accountId: string,
    @Query('returnUrl') returnUrl: string,
  ) {
    return this.stripeService.createAccountLink(accountId, returnUrl);
  }

  @Post('connect/login-link/:accountId')
  @ApiOperation({ summary: 'Create login link for Connect dashboard' })
  @ApiResponse({ status: 201, description: 'Login link created' })
  createLoginLink(@Param('accountId') accountId: string) {
    return this.stripeService.createLoginLink(accountId);
  }

  @Delete('connect/account/:accountId')
  @ApiOperation({ summary: 'Delete Connect account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  deleteConnectAccount(@Param('accountId') accountId: string) {
    return this.stripeService.deleteConnectAccount(accountId);
  }
}
