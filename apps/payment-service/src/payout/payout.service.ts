import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout, PayeeType, PayoutStatus, PayoutMethod } from '../../../../libs/database/src/entities/payout.entity';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';
import { StripeService } from '../stripe/stripe.service';
import { CreatePayoutDto } from './dto/create-payout.dto';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    @InjectRepository(Payout)
    private payoutRepository: Repository<Payout>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
    @InjectRepository(TaskerProfile)
    private taskerRepository: Repository<TaskerProfile>,
    private stripeService: StripeService,
  ) {}

  /**
   * Create payout to merchant, rider, or tasker
   */
  async createPayout(dto: CreatePayoutDto) {
    const stripe = this.stripeService.getStripeInstance();

    // Get Stripe account ID
    let stripeAccountId: string;
    let payeeType: PayeeType;
    let payeeId: string;

    switch (dto.recipientType) {
      case 'merchant': {
        const merchant = await this.merchantRepository.findOne({
          where: { id: dto.recipientId },
        });
        if (!merchant || !merchant.stripeAccountId) {
          throw new NotFoundException(
            'Merchant not found or Stripe account not connected',
          );
        }
        stripeAccountId = merchant.stripeAccountId;
        payeeType = PayeeType.MERCHANT;
        payeeId = merchant.id;
        break;
      }
      case 'rider': {
        const rider = await this.riderRepository.findOne({
          where: { id: dto.recipientId },
        });
        if (!rider || !rider.stripeAccountId) {
          throw new NotFoundException(
            'Rider not found or Stripe account not connected',
          );
        }
        stripeAccountId = rider.stripeAccountId;
        payeeType = PayeeType.RIDER;
        payeeId = rider.id;
        break;
      }
      case 'tasker': {
        const tasker = await this.taskerRepository.findOne({
          where: { id: dto.recipientId },
        });
        if (!tasker || !tasker.stripeAccountId) {
          throw new NotFoundException(
            'Tasker not found or Stripe account not connected',
          );
        }
        stripeAccountId = tasker.stripeAccountId;
        payeeType = PayeeType.TASKER;
        payeeId = tasker.id;
        break;
      }
      default:
        throw new BadRequestException('Invalid recipient type');
    }

    try {
      // Create Stripe transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(dto.amount * 100), // Convert to pence
        currency: 'gbp',
        destination: stripeAccountId,
        description: dto.description,
        metadata: {
          payeeType,
          payeeId,
          orderId: dto.orderId || '',
          jobBookingId: dto.jobBookingId || '',
        },
      });

      // Create payout record
      const payout = this.payoutRepository.create({
        payeeType,
        payeeId,
        amount: dto.amount,
        method: PayoutMethod.STRIPE_TRANSFER,
        stripeTransferId: transfer.id,
        status: PayoutStatus.COMPLETED,
        paidAt: new Date(),
        notes: dto.description,
        metadata: {
          transferId: transfer.id,
          destination: stripeAccountId,
          orderId: dto.orderId,
          jobBookingId: dto.jobBookingId,
        },
      });

      await this.payoutRepository.save(payout);

      return {
        payoutId: payout.id,
        transferId: transfer.id,
        amount: dto.amount,
        status: 'completed',
      };
    } catch (error) {
      this.logger.error('Failed to create payout', error.stack);

      // Create failed payout record
      const payout = this.payoutRepository.create({
        payeeType,
        payeeId,
        amount: dto.amount,
        method: PayoutMethod.STRIPE_TRANSFER,
        status: PayoutStatus.FAILED,
        notes: dto.description,
        metadata: {
          error: error.message,
          orderId: dto.orderId,
          jobBookingId: dto.jobBookingId,
        },
      });

      await this.payoutRepository.save(payout);

      throw new BadRequestException('Failed to process payout');
    }
  }

  /**
   * Get payout by ID
   */
  async getPayout(payoutId: string) {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  /**
   * Get payouts for recipient (merchant, rider, or tasker)
   */
  async getRecipientPayouts(
    recipientType: 'merchant' | 'rider' | 'tasker',
    recipientId: string,
    limit = 20,
    offset = 0,
  ) {
    const payeeType = recipientType.toUpperCase() as PayeeType;

    const [payouts, total] = await this.payoutRepository.findAndCount({
      where: {
        payeeType,
        payeeId: recipientId,
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return {
      payouts,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get total earnings for recipient
   */
  async getRecipientEarnings(
    recipientType: 'merchant' | 'rider' | 'tasker',
    recipientId: string,
  ) {
    const payeeType = recipientType.toUpperCase() as PayeeType;

    const result = await this.payoutRepository
      .createQueryBuilder('payout')
      .select('SUM(payout.amount)', 'totalEarnings')
      .where('payout.payeeType = :payeeType', { payeeType })
      .andWhere('payout.payeeId = :payeeId', { payeeId: recipientId })
      .andWhere('payout.status = :status', { status: PayoutStatus.COMPLETED })
      .getRawOne();

    return {
      totalEarnings: parseFloat(result.totalEarnings) || 0,
      currency: 'GBP',
      recipientType,
      recipientId,
    };
  }

  /**
   * Retry failed payout
   */
  async retryPayout(payoutId: string) {
    const payout = await this.getPayout(payoutId);

    if (payout.status !== PayoutStatus.FAILED) {
      throw new BadRequestException('Can only retry failed payouts');
    }

    // Extract metadata
    const orderId = payout.metadata?.orderId;
    const jobBookingId = payout.metadata?.jobBookingId;

    // Map payeeType to recipientType
    const recipientType = payout.payeeType.toLowerCase() as 'merchant' | 'rider' | 'tasker';

    // Create new payout with same details
    return this.createPayout({
      recipientType,
      recipientId: payout.payeeId,
      amount: payout.amount,
      description: payout.notes,
      orderId,
      jobBookingId,
    });
  }
}
