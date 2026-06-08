import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, PaymentMethod } from '../../../../libs/database/src/entities/transaction.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Job } from '../../../../libs/database/src/entities/job.entity';
import { Wallet } from '../../../../libs/database/src/entities/wallet.entity';
import { WalletTransaction, TransactionType, ReferenceType } from '../../../../libs/database/src/entities/wallet-transaction.entity';
import { StripeService } from '../stripe/stripe.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

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
    private stripeService: StripeService,
  ) {}

  /**
   * Create payment intent for order or job booking
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    const stripe = this.stripeService.getStripeInstance();

    try {
      // Calculate amount
      const amount = Math.round(dto.amount * 100); // Convert to pence

      // Get connected account ID if applicable
      let connectedAccountId: string | undefined;
      if (dto.merchantStripeAccountId) {
        connectedAccountId = dto.merchantStripeAccountId;
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'gbp',
        customer: dto.customerId,
        metadata: {
          orderId: dto.orderId || '',
          jobBookingId: dto.jobBookingId || '',
          userId: dto.userId,
        },
        application_fee_amount: dto.applicationFeeAmount
          ? Math.round(dto.applicationFeeAmount * 100)
          : undefined,
        transfer_data: connectedAccountId
          ? {
              destination: connectedAccountId,
            }
          : undefined,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create transaction record
      const transaction = this.transactionRepository.create({
        userId: dto.userId,
        orderId: dto.orderId,
        jobId: dto.jobBookingId,
        amount: dto.amount,
        paymentMethod: PaymentMethod.STRIPE,
        paymentIntentId: paymentIntent.id,
        status: TransactionStatus.PENDING,
        metadata: {
          clientSecret: paymentIntent.client_secret,
        },
      });

      await this.transactionRepository.save(transaction);

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: dto.amount,
        currency: 'BDT',
      };
    } catch (error) {
      this.logger.error('Failed to create payment intent', error.stack);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment (called after successful Stripe confirmation)
   */
  async confirmPayment(dto: ConfirmPaymentDto) {
    const transaction = await this.transactionRepository.findOne({
      where: { paymentIntentId: dto.paymentIntentId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    transaction.status = TransactionStatus.COMPLETED;
    await this.transactionRepository.save(transaction);

    // Update order status - jobs don't have payment status, they use JobStatus
    if (transaction.orderId) {
      // Import PaymentStatus from order entity
      await this.orderRepository.update(transaction.orderId, {
        paymentStatus: 'paid' as any, // PaymentStatus.PAID
      });
    }

    return {
      transactionId: transaction.id,
      status: 'completed',
      amount: transaction.amount,
    };
  }

  /**
   * Create direct transaction (for wallet payments, admin payments, etc.)
   */
  async createPayment(dto: CreatePaymentDto) {
    const transaction = this.transactionRepository.create({
      userId: dto.userId,
      orderId: dto.orderId,
      jobId: dto.jobBookingId,
      amount: dto.amount,
      paymentMethod: dto.method as PaymentMethod,
      status: (dto.status as TransactionStatus) || TransactionStatus.PENDING,
      metadata: dto.metadata,
    });

    await this.transactionRepository.save(transaction);

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  async getPayment(transactionId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Get transactions for user
   */
  async getUserPayments(userId: string, limit = 20, offset = 0) {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }

  /**
   * Refund payment
   */
  async refundPayment(dto: RefundPaymentDto) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: dto.paymentId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed transactions');
    }

    const stripe = this.stripeService.getStripeInstance();

    try {
      const refund = await stripe.refunds.create({
        payment_intent: transaction.paymentIntentId,
        amount: dto.amount ? Math.round(dto.amount * 100) : undefined,
        reason: dto.reason || 'requested_by_customer',
        metadata: {
          refundReason: dto.refundReason || '',
        },
      });

      // Update transaction status
      transaction.status = dto.amount && dto.amount < transaction.amount
        ? TransactionStatus.CANCELLED // Partial refund
        : TransactionStatus.FAILED; // Full refund

      transaction.metadata = {
        ...transaction.metadata,
        refundId: refund.id,
        refundAmount: dto.amount || transaction.amount,
        refundReason: dto.refundReason,
      };

      await this.transactionRepository.save(transaction);

      return {
        refundId: refund.id,
        amount: dto.amount || transaction.amount,
        status: transaction.status,
      };
    } catch (error) {
      this.logger.error('Failed to refund transaction', error.stack);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Process wallet payment
   */
  async processWalletPayment(
    userId: string,
    amount: number,
    orderId?: string,
    jobBookingId?: string,
  ) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Deduct from wallet
    wallet.balance -= amount;
    await this.walletRepository.save(wallet);

    // Create wallet transaction
    const walletTx = this.walletTransactionRepository.create({
      walletId: wallet.id,
      transactionType: TransactionType.DEBIT,
      amount,
      referenceType: orderId ? ReferenceType.ORDER : ReferenceType.JOB,
      referenceId: orderId || jobBookingId,
      balanceAfter: wallet.balance,
      description: orderId
        ? `Payment for order ${orderId}`
        : `Payment for job booking ${jobBookingId}`,
    });

    await this.walletTransactionRepository.save(walletTx);

    // Create transaction record
    const transaction = await this.createPayment({
      userId,
      orderId,
      jobBookingId,
      amount,
      currency: 'BDT',
      status: 'completed',
      method: 'wallet',
      metadata: { walletTransactionId: walletTx.id },
    });

    return {
      transactionId: transaction.id,
      walletBalance: wallet.balance,
      walletTransactionId: walletTx.id,
    };
  }

  /**
   * Initiate bKash Tokenized Checkout
   */
  async initiateBkashPayment(dto: {
    userId: string;
    amount: number;
    orderId?: string;
    jobBookingId?: string;
    callbackUrl?: string;
  }) {
    const paymentId = `BKASH_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transaction = this.transactionRepository.create({
      userId: dto.userId,
      orderId: dto.orderId,
      jobId: dto.jobBookingId,
      amount: dto.amount,
      paymentMethod: PaymentMethod.BKASH,
      paymentIntentId: paymentId,
      status: TransactionStatus.PENDING,
      metadata: {
        gateway: 'bKash Tokenized Checkout v1.2',
        callbackUrl: dto.callbackUrl,
      },
    });

    await this.transactionRepository.save(transaction);

    return {
      paymentId,
      transactionId: transaction.id,
      bkashURL: `https://checkout.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout?paymentID=${paymentId}`,
      amount: dto.amount,
      currency: 'BDT',
    };
  }

  /**
   * Initiate Nagad Direct Gateway
   */
  async initiateNagadPayment(dto: {
    userId: string;
    amount: number;
    orderId?: string;
    jobBookingId?: string;
  }) {
    const paymentReference = `NAGAD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transaction = this.transactionRepository.create({
      userId: dto.userId,
      orderId: dto.orderId,
      jobId: dto.jobBookingId,
      amount: dto.amount,
      paymentMethod: PaymentMethod.NAGAD,
      paymentIntentId: paymentReference,
      status: TransactionStatus.PENDING,
      metadata: {
        gateway: 'Nagad PGW v0.2',
      },
    });

    await this.transactionRepository.save(transaction);

    return {
      paymentReference,
      transactionId: transaction.id,
      callBackUrl: `https://api.elara.com.bd/payments/nagad/callback?ref=${paymentReference}`,
      amount: dto.amount,
      currency: 'BDT',
    };
  }

  /**
   * Initiate Cash on Delivery (COD)
   */
  async initiateCashOnDelivery(dto: {
    userId: string;
    amount: number;
    orderId?: string;
  }) {
    const transaction = this.transactionRepository.create({
      userId: dto.userId,
      orderId: dto.orderId,
      amount: dto.amount,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.PENDING,
      metadata: {
        type: 'Cash on Delivery',
        toCollectBDT: dto.amount,
      },
    });

    await this.transactionRepository.save(transaction);

    return {
      transactionId: transaction.id,
      status: 'pending_collection_at_doorstep',
      amountToCollect: dto.amount,
      currency: 'BDT',
    };
  }
}

