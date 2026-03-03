import { IsString, IsEmail, IsEnum, IsArray, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '../../../../../libs/database/src/entities/admin-user.entity';

export class CreateAdminUserDto {
  @ApiProperty({ description: 'Admin user name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Admin email', example: 'admin@elara.com.bd' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Admin password', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Admin role',
    enum: AdminRole,
    example: AdminRole.SUPPORT,
  })
  @IsEnum(AdminRole)
  role: AdminRole;

  @ApiPropertyOptional({
    description: 'Array of specific permissions',
    type: [String],
    example: ['users.view', 'users.edit'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
