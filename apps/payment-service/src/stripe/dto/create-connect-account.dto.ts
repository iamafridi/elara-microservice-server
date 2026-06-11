import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsUUID, IsUrl } from 'class-validator';

export class CreateConnectAccountDto {
  @ApiProperty({
    description: 'Type of account (merchant, rider, or tasker)',
    enum: ['merchant', 'rider', 'tasker'],
  })
  @IsEnum(['merchant', 'rider', 'tasker'])
  accountType: 'merchant' | 'rider' | 'tasker';

  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Return URL after onboarding' })
  @IsUrl()
  returnUrl: string;
}
