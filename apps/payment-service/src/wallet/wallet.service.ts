import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../../../../libs/database/src/entities/wallet.entity';
import { WalletTransaction, TransactionType, ReferenceType } from '../../../../libs/database/src/entities/wallet-transaction.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { AddFundsDto } from './dto/add-funds.dto';
import { WithdrawFundsDto } from './dto/withdraw-funds.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private transactionRepository: Repository<WalletTransaction>,
  ) {}

  /**
   * Create wallet for user
   */
  async createWallet(dto: CreateWalletDto) {
    const existingWallet = await this.walletRepository.findOne({
      where: { userId: dto.userId },
    });

    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this user');
    }

    const wallet = this.walletRepository.create({
      userId: dto.userId,
      balance: 0,
      currency: 'GBP',
    });

    await this.walletRepository.save(wallet);

    return wallet;
  }

  /**
   * Get wallet by user ID
   */
  async getWallet(userId: string) {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string) {
    const wallet = await this.getWallet(userId);
    return {
      balance: wallet.balance,
      currency: wallet.currency,
      userId: wallet.userId,
    };
  }

  /**
   * Add funds to wallet
   */
  async addFunds(dto: AddFundsDto) {
    const wallet = await this.getWallet(dto.userId);

    wallet.balance += dto.amount;
    await this.walletRepository.save(wallet);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      transactionType: TransactionType.CREDIT,
      amount: dto.amount,
      referenceType: ReferenceType.TOPUP,
      balanceAfter: wallet.balance,
      description: dto.description || 'Funds added to wallet',
      metadata: dto.metadata,
    });

    await this.transactionRepository.save(transaction);

    return {
      walletId: wallet.id,
      balance: wallet.balance,
      transactionId: transaction.id,
    };
  }

  /**
   * Withdraw funds from wallet
   */
  async withdrawFunds(dto: WithdrawFundsDto) {
    const wallet = await this.getWallet(dto.userId);

    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    wallet.balance -= dto.amount;
    await this.walletRepository.save(wallet);

    // Create transaction record
    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      transactionType: TransactionType.DEBIT,
      amount: dto.amount,
      referenceType: ReferenceType.WITHDRAWAL,
      balanceAfter: wallet.balance,
      description: dto.description || 'Funds withdrawn from wallet',
      metadata: dto.metadata,
    });

    await this.transactionRepository.save(transaction);

    return {
      walletId: wallet.id,
      balance: wallet.balance,
      transactionId: transaction.id,
    };
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(userId: string, limit = 20, offset = 0) {
    const wallet = await this.getWallet(userId);

    const [transactions, total] =
      await this.transactionRepository.findAndCount({
        where: { walletId: wallet.id },
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
   * Get transaction by ID
   */
  async getTransaction(transactionId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
