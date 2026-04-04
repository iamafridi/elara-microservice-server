import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';

export class SubmitQuoteDto {
  @ApiProperty({ description: 'Job ID' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Tasker ID' })
  @IsUUID()
  taskerId: string;

  @ApiProperty({ description: 'Quoted price' })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Quote message/details', required: false })
  @IsString()
  @IsOptional()
  message?: string;
}
