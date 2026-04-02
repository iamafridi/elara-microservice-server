import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength, IsNumber } from 'class-validator';

export enum PortfolioFileType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export class AddPortfolioItemDto {
  @ApiProperty({
    description: 'Tasker ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  taskerId: string;

  @ApiProperty({
    description: 'URL of the portfolio file (image or video)',
    example: 'https://cdn.elara.com.bd/portfolios/image.jpg',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    description: 'Type of file',
    enum: PortfolioFileType,
    example: PortfolioFileType.IMAGE,
  })
  @IsEnum(PortfolioFileType)
  fileType: PortfolioFileType;

  @ApiPropertyOptional({
    description: 'Caption or description for the portfolio item',
    example: 'Completed bathroom renovation project in Central London',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  caption?: string;
}

export class UpdatePortfolioItemDto {
  @ApiPropertyOptional({
    description: 'Updated caption',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({
    description: 'Sort order for displaying portfolio items',
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
