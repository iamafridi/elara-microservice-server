import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsUrl } from 'class-validator';

export class UpdateConnectAccountDto {
  @ApiProperty({ description: 'Business name', required: false })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiProperty({ description: 'Business website URL', required: false })
  @IsUrl()
  @IsOptional()
  businessUrl?: string;

  @ApiProperty({ description: 'Support email', required: false })
  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @ApiProperty({ description: 'Support phone', required: false })
  @IsString()
  @IsOptional()
  supportPhone?: string;

  @ApiProperty({
    description: 'Payout schedule',
    enum: ['daily', 'weekly', 'monthly'],
    required: false,
  })
  @IsEnum(['daily', 'weekly', 'monthly'])
  @IsOptional()
  payoutSchedule?: 'daily' | 'weekly' | 'monthly';
}
