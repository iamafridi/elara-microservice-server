import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Merchant } from '../../../../libs/database/src/entities/merchant.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';
import { CreateConnectAccountDto } from './dto/create-connect-account.dto';
import { UpdateConnectAccountDto } from './dto/update-connect-account.dto';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
    @InjectRepository(TaskerProfile)
    private taskerRepository: Repository<TaskerProfile>,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured');
    }
    this.stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create Stripe Connect account for merchant, rider, or tasker
   */
  async createConnectAccount(dto: CreateConnectAccountDto) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: 'GB',
        email: dto.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: dto.accountType === 'merchant' ? 'company' : 'individual',
        metadata: {
          accountType: dto.accountType,
          userId: dto.userId,
        },
      });

      // Store Stripe account ID
      await this.updateUserStripeAccount(
        dto.accountType,
        dto.userId,
        account.id,
      );

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${dto.returnUrl}?refresh=true`,
        return_url: `${dto.returnUrl}?success=true`,
        type: 'account_onboarding',
      });

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      this.logger.error('Failed to create Connect account', error.stack);
      throw new BadRequestException('Failed to create Stripe Connect account');
    }
  }

  /**
   * Get Connect account details
   */
  async getConnectAccount(accountId: string) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
        capabilities: account.capabilities,
      };
    } catch (error) {
      this.logger.error('Failed to retrieve Connect account', error.stack);
      throw new BadRequestException('Failed to retrieve Stripe account');
    }
  }

  /**
   * Update Connect account information
   */
  async updateConnectAccount(
    accountId: string,
    dto: UpdateConnectAccountDto,
  ) {
    try {
      const account = await this.stripe.accounts.update(accountId, {
        business_profile: {
          name: dto.businessName,
          url: dto.businessUrl,
          support_email: dto.supportEmail,
          support_phone: dto.supportPhone,
        },
        settings: {
          payouts: {
            schedule: {
              interval: dto.payoutSchedule || 'weekly',
              weekly_anchor: 'friday',
            },
          },
        },
      });

      return {
        id: account.id,
        updated: true,
      };
    } catch (error) {
      this.logger.error('Failed to update Connect account', error.stack);
      throw new BadRequestException('Failed to update Stripe account');
    }
  }

  /**
   * Create account link for re-authentication or updates
   */
  async createAccountLink(accountId: string, returnUrl: string) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${returnUrl}?refresh=true`,
        return_url: `${returnUrl}?success=true`,
        type: 'account_onboarding',
      });

      return {
        url: accountLink.url,
      };
    } catch (error) {
      this.logger.error('Failed to create account link', error.stack);
      throw new BadRequestException('Failed to create account link');
    }
  }

  /**
   * Create login link for Connect dashboard
   */
  async createLoginLink(accountId: string) {
    try {
      const loginLink = await this.stripe.accounts.createLoginLink(accountId);
      return {
        url: loginLink.url,
      };
    } catch (error) {
      this.logger.error('Failed to create login link', error.stack);
      throw new BadRequestException('Failed to create dashboard login link');
    }
  }

  /**
   * Delete Connect account
   */
  async deleteConnectAccount(accountId: string) {
    try {
      await this.stripe.accounts.del(accountId);
      return {
        deleted: true,
        accountId,
      };
    } catch (error) {
      this.logger.error('Failed to delete Connect account', error.stack);
      throw new BadRequestException('Failed to delete Stripe account');
    }
  }

  /**
   * Helper: Update user's Stripe account ID in database
   */
  private async updateUserStripeAccount(
    accountType: 'merchant' | 'rider' | 'tasker',
    userId: string,
    stripeAccountId: string,
  ) {
    switch (accountType) {
      case 'merchant':
        await this.merchantRepository.update(userId, {
          stripeAccountId,
        });
        break;
      case 'rider':
        await this.riderRepository.update(userId, {
          stripeAccountId,
        });
        break;
      case 'tasker':
        await this.taskerRepository.update(userId, {
          stripeAccountId,
        });
        break;
    }
  }

  /**
   * Get Stripe instance for use in other services
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
