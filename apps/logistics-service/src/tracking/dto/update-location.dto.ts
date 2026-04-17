import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 51.5074,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -0.1278,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Heading/bearing in degrees (0-360)',
    example: 90,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(360)
  heading?: number;

  @ApiPropertyOptional({
    description: 'Speed in km/h',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  speed?: number;
}
