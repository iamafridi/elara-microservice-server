import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BankProvider {
  TRUELAYER = 'truelayer',
  PLAID = 'plaid',
  GOCARDLESS = 'gocardless',
}

export class ConnectBankDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ enum: BankProvider, default: BankProvider.TRUELAYER })
  @IsEnum(BankProvider)
  @IsOptional()
  provider?: BankProvider;

  @ApiPropertyOptional({ description: 'Redirect URI after bank connection' })
  @IsString()
  @IsOptional()
  redirectUri?: string;
}

export class BankConnectionCallbackDto {
  @ApiProperty({ description: 'Authorization code from bank' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'State parameter for CSRF protection' })
  @IsString()
  @IsOptional()
  state?: string;
}
