import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  to: string;

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

  @ApiProperty({ description: 'CC email addresses', required: false, type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];

  @ApiProperty({ description: 'BCC email addresses', required: false, type: [String] })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  bcc?: string[];

  @ApiProperty({ description: 'Attachment URLs', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
