import { IsString, IsOptional, IsEnum, IsArray, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VideoPrivacy {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export class CreateFeedVideoDto {
  @ApiProperty({ description: 'Rider ID' })
  @IsString()
  riderId: string;

  @ApiProperty({ description: 'Video URL (from media service)' })
  @IsString()
  videoUrl: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Caption/description', example: 'Just completed my 100th delivery today! 🎉' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({ description: 'Hashtags', type: [String], example: ['#delivery', '#tapmate', '#grind'] })
  @IsArray()
  @IsOptional()
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Background music', example: 'Song Title - Artist' })
  @IsString()
  @IsOptional()
  music?: string;

  @ApiPropertyOptional({ enum: VideoPrivacy, default: VideoPrivacy.PUBLIC })
  @IsEnum(VideoPrivacy)
  @IsOptional()
  privacy?: VideoPrivacy;
}

export class UpdateFeedVideoDto {
  @ApiPropertyOptional({ description: 'Caption/description' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({ description: 'Hashtags', type: [String] })
  @IsArray()
  @IsOptional()
  hashtags?: string[];

  @ApiPropertyOptional({ enum: VideoPrivacy })
  @IsEnum(VideoPrivacy)
  @IsOptional()
  privacy?: VideoPrivacy;
}
