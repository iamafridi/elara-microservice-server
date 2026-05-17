import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiProperty({ description: 'Enable push notifications', required: false })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiProperty({ description: 'Enable email notifications', required: false })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiProperty({ description: 'Enable SMS notifications', required: false })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiProperty({ description: 'Enable order notifications', required: false })
  @IsBoolean()
  @IsOptional()
  orderNotifications?: boolean;

  @ApiProperty({ description: 'Enable booking notifications', required: false })
  @IsBoolean()
  @IsOptional()
  bookingNotifications?: boolean;

  @ApiProperty({ description: 'Enable payment notifications', required: false })
  @IsBoolean()
  @IsOptional()
  paymentNotifications?: boolean;

  @ApiProperty({ description: 'Enable marketing notifications', required: false })
  @IsBoolean()
  @IsOptional()
  marketingNotifications?: boolean;
}
