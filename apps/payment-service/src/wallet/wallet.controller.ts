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
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AddFundsDto } from './dto/add-funds.dto';
import { WithdrawFundsDto } from './dto/withdraw-funds.dto';

@ApiTags('Wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({ summary: 'Create wallet for user' })
  @ApiResponse({ status: 201, description: 'Wallet created' })
  @ApiResponse({ status: 400, description: 'Wallet already exists' })
  createWallet(@Body() dto: CreateWalletDto) {
    return this.walletService.createWallet(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get wallet by user ID' })
  @ApiResponse({ status: 200, description: 'Wallet details' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  getWallet(@Param('userId') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('user/:userId/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  getBalance(@Param('userId') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Post('add-funds')
  @ApiOperation({ summary: 'Add funds to wallet' })
  @ApiResponse({ status: 200, description: 'Funds added successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  addFunds(@Body() dto: AddFundsDto) {
    return this.walletService.addFunds(dto);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  @ApiResponse({ status: 200, description: 'Funds withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance' })
  withdrawFunds(@Body() dto: WithdrawFundsDto) {
    return this.walletService.withdrawFunds(dto);
  }

  @Get('user/:userId/transactions')
  @ApiOperation({ summary: 'Get wallet transactions' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  getTransactions(
    @Param('userId') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.walletService.getTransactions(userId, limit, offset);
  }

  @Get('transactions/:transactionId')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction details' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransaction(@Param('transactionId') transactionId: string) {
    return this.walletService.getTransaction(transactionId);
  }
}
