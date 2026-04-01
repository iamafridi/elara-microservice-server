import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { BudgetType } from '../../../../../libs/database/src/entities/job.entity';

export class CreateJobDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Job category ID' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ description: 'Job subcategory ID', required: false })
  @IsUUID()
  @IsOptional()
  subcategoryId?: string;

  @ApiProperty({ description: 'Job title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Job description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Job photos', type: [String], required: false })
  @IsArray()
  @IsOptional()
  photos?: string[];

  @ApiProperty({ description: 'Job videos', type: [String], required: false })
  @IsArray()
  @IsOptional()
  videos?: string[];

  @ApiProperty({ description: 'Job address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Postcode' })
  @IsString()
  postcode: string;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Budget type', enum: BudgetType })
  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @ApiProperty({ description: 'Budget amount' })
  @IsNumber()
  budgetAmount: number;

  @ApiProperty({ description: 'Search radius in miles', required: false })
  @IsNumber()
  @IsOptional()
  radiusMiles?: number;

  @ApiProperty({ description: 'Is job public', required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ description: 'Preferred start date', required: false })
  @IsDateString()
  @IsOptional()
  preferredStartDate?: string;
}
