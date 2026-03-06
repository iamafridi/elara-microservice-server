import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSettingDto {
  @ApiProperty({
    description: 'Setting key (must be unique)',
    example: 'app.maintenance_mode',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Setting value',
    example: 'false',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({
    description: 'Description of the setting',
    example: 'Enable or disable maintenance mode',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
