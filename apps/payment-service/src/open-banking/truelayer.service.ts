import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface TrueLayerAuthLink {
  url: string;
  state: string;
}

export interface TrueLayerTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
}

export interface TrueLayerAccount {
  account_id: string;
  account_number: {
    iban?: string;
    number?: string;
    sort_code?: string;
  };
  account_type: string;
  currency: string;
  display_name: string;
  provider: {
    display_name: string;
    logo_uri: string;
    provider_id: string;
  };
}

export interface TrueLayerPaymentResponse {
  id: string;
  user_id: string;
  resource_token: string;
  authorization_flow: {
    actions: {
      next: {
        type: string;
        uri: string;
      };
    };
  };
  status: string;
}

@Injectable()
export class TrueLayerService {
  private readonly logger = new Logger(TrueLayerService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly baseUrl: string;
  private readonly authUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.clientId = this.configService.get<string>('OPEN_BANKING_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('OPEN_BANKING_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('OPEN_BANKING_REDIRECT_URI');

    // TrueLayer Sandbox URLs (switch to production when ready)
    this.baseUrl = 'https://api.truelayer-sandbox.com';
    this.authUrl = 'https://auth.truelayer-sandbox.com';
  }

  /**
   * Generate authorization URL for bank connection
   */
  generateAuthUrl(userId: string): TrueLayerAuthLink {
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'info accounts balance transactions offline_access payments',
      state: `${state}:${userId}`,
      nonce,
      enable_mock: 'true', // For sandbox testing
    });

    return {
      url: `${this.authUrl}?${params.toString()}`,
      state,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<TrueLayerTokenResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<TrueLayerTokenResponse>(
          `${this.authUrl}/connect/token`,
          new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            code,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.logger.log('Successfully exchanged code for token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
      throw new BadRequestException('Failed to connect bank account');
    }
  }

  /**
   * Get user's bank accounts
   */
  async getAccounts(accessToken: string): Promise<TrueLayerAccount[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ results: TrueLayerAccount[] }>(
          `${this.baseUrl}/data/v1/accounts`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return response.data.results;
    } catch (error) {
      this.logger.error('Failed to fetch accounts', error.response?.data || error.message);
      throw new BadRequestException('Failed to fetch bank accounts');
    }
  }

  /**
   * Initiate a payment
   */
  async initiatePayment(
    accessToken: string,
    amount: number,
    reference: string,
    beneficiaryAccountNumber: string,
    beneficiarySortCode: string,
  ): Promise<TrueLayerPaymentResponse> {
    const paymentRequest = {
      amount_in_minor: Math.round(amount * 100), // Convert to pence
      currency: 'GBP',
      payment_method: {
        type: 'bank_transfer',
        provider_selection: {
          type: 'user_selected',
        },
        beneficiary: {
          type: 'merchant_account',
          merchant_account_id: 'YOUR_MERCHANT_ACCOUNT_ID', // This should be configured
          account_holder_name: 'Elara Commerce BD Ltd',
        },
      },
      user: {
        id: crypto.randomBytes(16).toString('hex'),
      },
      metadata: {
        reference,
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<TrueLayerPaymentResponse>(
          `${this.baseUrl}/payments`,
          paymentRequest,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Idempotency-Key': crypto.randomUUID(),
            },
          },
        ),
      );

      this.logger.log(`Payment initiated: ${response.data.id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to initiate payment', error.response?.data || error.message);
      throw new BadRequestException('Failed to initiate payment');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string, accessToken: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get payment status', error.response?.data || error.message);
      throw new BadRequestException('Failed to get payment status');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TrueLayerTokenResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<TrueLayerTokenResponse>(
          `${this.authUrl}/connect/token`,
          new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: refreshToken,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.logger.log('Successfully refreshed token');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh token', error.response?.data || error.message);
      throw new BadRequestException('Failed to refresh access token');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, webhookSecret: string): boolean {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const computedSignature = hmac.update(payload).digest('base64');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  }
}
