import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, IsString, IsObject, Min } from 'class-validator';

export class AddFundsDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Amount to add' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Transaction description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
