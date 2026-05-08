import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';

export class SendTemplateEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'Template ID or name' })
  @IsString()
  templateId: string;

  @ApiProperty({ description: 'Template variables', required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;

  @ApiProperty({ description: 'Reply-to email address', required: false })
  @IsEmail()
  @IsOptional()
  replyTo?: string;
}
