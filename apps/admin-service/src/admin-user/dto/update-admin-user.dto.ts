import { IsString, IsEnum, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '../../../../../libs/database/src/entities/admin-user.entity';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: 'Admin user name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Admin role',
    enum: AdminRole,
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({
    description: 'Array of specific permissions',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ description: 'Whether admin is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
