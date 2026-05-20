import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsPhoneNumber } from 'class-validator';

export class SendBulkSmsDto {
  @ApiProperty({ description: 'Recipient phone numbers in E.164 format', type: [String] })
  @IsArray()
  @IsPhoneNumber(undefined, { each: true })
  recipients: string[];

  @ApiProperty({ description: 'SMS message body' })
  @IsString()
  message: string;
}
