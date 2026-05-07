import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsEmail, IsOptional } from 'class-validator';

export class SendBulkEmailDto {
  @ApiProperty({ description: 'Recipient email addresses', type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[];

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Plain text content', required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ description: 'HTML content', required: false })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiProperty({ description: 'Reply-to email address', required: false })
  @IsEmail()
  @IsOptional()
  replyTo?: string;
}
