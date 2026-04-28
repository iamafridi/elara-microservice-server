import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
}

export class ResizeImageDto {
  @ApiProperty({ description: 'Width in pixels', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4000)
  width?: number;

  @ApiProperty({ description: 'Height in pixels', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4000)
  height?: number;

  @ApiProperty({ description: 'Output format', enum: ImageFormat, required: false })
  @IsEnum(ImageFormat)
  @IsOptional()
  format?: ImageFormat;

  @ApiProperty({ description: 'Quality (1-100)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  quality?: number;
}

export class CompressImageDto {
  @ApiProperty({ description: 'Quality (1-100)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  quality?: number;

  @ApiProperty({ description: 'Output format', enum: ImageFormat, required: false })
  @IsEnum(ImageFormat)
  @IsOptional()
  format?: ImageFormat;
}

export class ThumbnailDto {
  @ApiProperty({ description: 'Thumbnail width', required: false })
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(500)
  width?: number;

  @ApiProperty({ description: 'Thumbnail height', required: false })
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(500)
  height?: number;
}
