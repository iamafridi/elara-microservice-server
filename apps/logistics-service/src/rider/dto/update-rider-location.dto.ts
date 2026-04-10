import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateRiderLocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Heading in degrees', required: false })
  @IsNumber()
  @IsOptional()
  heading?: number;

  @ApiProperty({ description: 'Speed in km/h', required: false })
  @IsNumber()
  @IsOptional()
  speed?: number;
}
