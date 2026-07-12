import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ModuleType } from '../../../../../libs/database/src/entities/order.entity';

export class UpdatePageDto {
  @ApiProperty({ description: 'Page title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Meta description', required: false })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiProperty({ description: 'H1 heading', required: false })
  @IsString()
  @IsOptional()
  h1?: string;

  @ApiProperty({ description: 'Page content (JSON structure)', required: false })
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @ApiProperty({ description: 'Schema.org markup', required: false })
  @IsObject()
  @IsOptional()
  schema?: Record<string, any>;

  @ApiProperty({ description: 'Module type', enum: ModuleType, required: false })
  @IsEnum(ModuleType)
  @IsOptional()
  moduleType?: ModuleType;

  @ApiProperty({ description: 'City', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Postcode', required: false })
  @IsString()
  @IsOptional()
  postcode?: string;
}
