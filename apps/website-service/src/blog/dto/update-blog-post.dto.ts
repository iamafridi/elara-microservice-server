import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateBlogPostDto {
  @ApiProperty({ description: 'Blog post title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Blog post content', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Author name', required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ description: 'Meta description', required: false })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiProperty({ description: 'Featured image URL', required: false })
  @IsString()
  @IsOptional()
  featuredImage?: string;

  @ApiProperty({ description: 'Tags', type: [String], required: false })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
