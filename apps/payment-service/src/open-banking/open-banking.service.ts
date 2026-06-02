import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, PaymentMethod } from '../../../../libs/database/src/entities/transaction.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { Wallet } from '../../../../libs/database/src/entities/wallet.entity';
import { WalletTransaction, TransactionType, ReferenceType } from '../../../../libs/database/src/entities/wallet-transaction.entity';
import { TrueLayerService } from './truelayer.service';
import { ConnectBankDto, BankConnectionCallbackDto } from './dto/connect-bank.dto';
import { InitiateOpenBankingPaymentDto, PaymentPurpose } from './dto/initiate-payment.dto';
import { TrueLayerWebhookDto, TrueLayerWebhookEventType } from './dto/truelayer-webhook.dto';

interface BankConnection {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  accounts: any[];
}

@Injectable()
export class OpenBankingService {
  private readonly logger = new Logger(OpenBankingService.name);

  // In production, store these in database or Redis
  private bankConnections: Map<string, BankConnection> = new Map();
  private paymentStates: Map<string, any> = new Map();

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    private trueLayerService: TrueLayerService,
  ) {}

  /**
   * Initiate bank connection flow
   */
  async connectBank(dto: ConnectBankDto) {
    this.logger.log(`Initiating bank connection for user: ${dto.userId}`);

    const authLink = this.trueLayerService.generateAuthUrl(dto.userId);

    // Store state for verification
    this.paymentStates.set(authLink.state, {
      userId: dto.userId,
      createdAt: new Date(),
    });

    return {
      authorizationUrl: authLink.url,
      state: authLink.state,
      provider: 'truelayer',
    };
  }

  /**
   * Handle bank connection callback
   */
  async handleBankCallback(dto: BankConnectionCallbackDto) {
    this.logger.log(`Processing bank connection callback for user: ${dto.userId}`);

    // Exchange code for token
    const tokenResponse = await this.trueLayerService.exchangeCodeForToken(dto.code);

    // Get user's accounts
    const accounts = await this.trueLayerService.getAccounts(tokenResponse.access_token);

    // Store connection (in production, save to database)
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
    this.bankConnections.set(dto.userId, {
      userId: dto.userId,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
      accounts,
    });

    this.logger.log(`Bank connection successful for user ${dto.userId}: ${accounts.length} accounts found`);

    return {
      success: true,
      accountsCount: accounts.length,
      accounts: accounts.map((acc) => ({
        id: acc.account_id,
        displayName: acc.display_name,
        accountNumber: acc.account_number,
        currency: acc.currency,
        provider: acc.provider.display_name,
      })),
    };
  }

  /**
   * Get user's connected bank accounts
   */
  async getUserBankAccounts(userId: string) {
    const connection = this.bankConnections.get(userId);

    if (!connection) {
      throw new NotFoundException('No bank connection found. Please connect your bank first.');
    }

    // Check if token expired
    if (new Date() > connection.expiresAt) {
      // Refresh token
      const tokenResponse = await this.trueLayerService.refreshToken(connection.refreshToken);
      connection.accessToken = tokenResponse.access_token;
      connection.expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      this.bankConnections.set(userId, connection);
    }

    return {
      accounts: connection.accounts.map((acc) => ({
        id: acc.account_id,
        displayName: acc.display_name,
        accountNumber: acc.account_number,
        currency: acc.currency,
        provider: acc.provider.display_name,
      })),
    };
  }

  /**
   * Initiate Open Banking payment
   */
  async initiatePayment(dto: InitiateOpenBankingPaymentDto) {
    this.logger.log(`Initiating Open Banking payment for user: ${dto.userId}, amount: £${dto.amount}`);

    const connection = this.bankConnections.get(dto.userId);

    if (!connection) {
      throw new BadRequestException('No bank connection found. Please connect your bank first.');
    }

    // Verify order/job exists
    if (dto.purpose === PaymentPurpose.ORDER && dto.orderId) {
      const order = await this.orderRepository.findOne({ where: { id: dto.orderId } });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
    } else if (dto.purpose === PaymentPurpose.JOB_BOOKING && dto.jobBookingId) {
      const job = await this.jobRepository.findOne({ where: { id: dto.jobBookingId } });
      if (!job) {
        throw new NotFoundException('Job booking not found');
      }
    }

    // Generate payment reference
    const reference = dto.reference || this.generatePaymentReference(dto.purpose, dto.orderId || dto.jobBookingId);

    // Initiate payment with TrueLayer
    const paymentResponse = await this.trueLayerService.initiatePayment(
      connection.accessToken,
      dto.amount,
      reference,
      '12345678', // Beneficiary account number (Elara settlement account)
      '12-34-56', // Beneficiary routing code (Elara routing code)
    );

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId: dto.userId,
      orderId: dto.orderId,
      jobId: dto.jobBookingId,
      amount: dto.amount,
      paymentMethod: PaymentMethod.OPEN_BANKING,
      paymentIntentId: paymentResponse.id,
      status: TransactionStatus.PENDING,
      metadata: {
        provider: 'truelayer',
        reference,
        paymentPurpose: dto.purpose,
      },
    });

    await this.transactionRepository.save(transaction);

    this.logger.log(`Open Banking payment initiated: ${transaction.id}`);

    return {
      transactionId: transaction.id,
      paymentId: paymentResponse.id,
      authorizationUrl: paymentResponse.authorization_flow.actions.next.uri,
      status: paymentResponse.status,
      reference,
    };
  }

  /**
   * Handle TrueLayer webhook
   */
  async handleWebhook(webhookDto: TrueLayerWebhookDto) {
    this.logger.log(`Processing webhook: ${webhookDto.type} for payment ${webhookDto.payment_id}`);

    const transaction = await this.transactionRepository.findOne({
      where: { paymentIntentId: webhookDto.payment_id },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for payment ID: ${webhookDto.payment_id}`);
      return { received: true };
    }

    switch (webhookDto.type) {
      case TrueLayerWebhookEventType.PAYMENT_EXECUTED:
        transaction.status = TransactionStatus.COMPLETED;
        await this.transactionRepository.save(transaction);

        // Update order status if applicable
        if (transaction.orderId) {
          await this.orderRepository.update(transaction.orderId, {
            paymentStatus: 'paid' as any,
          });
        }

        // Handle wallet top-up if applicable
        if (transaction.metadata?.paymentPurpose === PaymentPurpose.WALLET_TOPUP) {
          await this.topUpWallet(transaction.userId, transaction.amount, transaction.id);
        }

        this.logger.log(`Payment executed successfully: ${transaction.id}`);
        break;

      case TrueLayerWebhookEventType.PAYMENT_FAILED:
        transaction.status = TransactionStatus.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          failureReason: webhookDto.failure_reason,
        };
        await this.transactionRepository.save(transaction);

        this.logger.warn(`Payment failed: ${transaction.id}, reason: ${webhookDto.failure_reason}`);
        break;

      case TrueLayerWebhookEventType.PAYMENT_SETTLED:
        this.logger.log(`Payment settled: ${transaction.id}`);
        // Additional settlement logic if needed
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${webhookDto.type}`);
    }

    return { received: true, status: transaction.status };
  }

  /**
   * Top up wallet from Open Banking payment
   */
  private async topUpWallet(userId: string, amount: number, transactionId: string) {
    let wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
      });
    }

    wallet.balance += amount;
    await this.walletRepository.save(wallet);

    // Create wallet transaction record
    const walletTx = this.walletTransactionRepository.create({
      walletId: wallet.id,
      transactionType: TransactionType.CREDIT,
      amount,
      referenceType: ReferenceType.TOPUP,
      referenceId: transactionId,
      balanceAfter: wallet.balance,
      description: `Wallet top-up via Open Banking - £${amount.toFixed(2)}`,
    });

    await this.walletTransactionRepository.save(walletTx);

    this.logger.log(`Wallet topped up: £${amount} for user ${userId}, new balance: £${wallet.balance}`);
  }

  /**
   * Generate payment reference
   */
  private generatePaymentReference(purpose: PaymentPurpose, referenceId?: string): string {
    const prefix = {
      [PaymentPurpose.ORDER]: 'ORD',
      [PaymentPurpose.JOB_BOOKING]: 'JOB',
      [PaymentPurpose.WALLET_TOPUP]: 'WAL',
      [PaymentPurpose.SUBSCRIPTION]: 'SUB',
    }[purpose];

    const shortId = referenceId ? referenceId.substring(0, 8) : Date.now().toString(36);
    return `${prefix}-${shortId}`.toUpperCase();
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string, userId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      transactionId: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      createdAt: transaction.createdAt,
      metadata: transaction.metadata,
    };
  }
}
