import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateFaqDto {
  @ApiProperty({ description: 'Question', required: false })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({ description: 'Answer', required: false })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiProperty({ description: 'Category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Sort order', required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: 'Is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
