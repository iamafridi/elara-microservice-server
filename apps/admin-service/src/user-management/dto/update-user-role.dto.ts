import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../../libs/database/src/entities/user.entity';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: UserRole,
    example: UserRole.MERCHANT,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
