import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateBlogPostDto {
  @ApiProperty({ description: 'Blog post slug (URL-friendly)' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Blog post title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Blog post content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Author name' })
  @IsString()
  author: string;

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
