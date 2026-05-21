import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ description: 'Recipient phone number in E.164 format' })
  @IsPhoneNumber()
  to: string;

  @ApiProperty({ description: 'SMS message body' })
  @IsString()
  message: string;
}
