import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ description: 'Zone name', example: 'Downtown Area' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'GeoJSON polygon coordinates',
    example: {
      type: 'Polygon',
      coordinates: [[[-74.0060, 40.7128], [-74.0050, 40.7130], [-74.0040, 40.7128], [-74.0060, 40.7128]]]
    }
  })
  @IsObject()
  polygon: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateZoneDto {
  @ApiPropertyOptional({ description: 'Zone name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'GeoJSON polygon coordinates' })
  @IsObject()
  @IsOptional()
  polygon?: any;

  @ApiPropertyOptional({ description: 'Zone status' })
  @IsString()
  @IsOptional()
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ConfigureZoneModuleDto {
  @ApiProperty({ description: 'Zone ID' })
  @IsString()
  zoneId: string;

  @ApiProperty({ description: 'Module type', example: 'ECOMMERCE' })
  @IsString()
  moduleName: string;

  @ApiProperty({ description: 'Delivery fee for this zone and module' })
  @IsNumber()
  deliveryFee: number;

  @ApiProperty({ description: 'Commission percentage' })
  @IsNumber()
  commissionPercent: number;

  @ApiPropertyOptional({ description: 'Is module active in this zone', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignRiderToZoneDto {
  @ApiProperty({ description: 'Rider ID' })
  @IsString()
  riderId: string;

  @ApiProperty({ description: 'Zone ID' })
  @IsString()
  zoneId: string;
}

export class CheckLocationDto {
  @ApiProperty({ description: 'Latitude', example: 40.7128 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: -74.0060 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Module type to filter zones' })
  @IsString()
  @IsOptional()
  moduleType?: string;
}
