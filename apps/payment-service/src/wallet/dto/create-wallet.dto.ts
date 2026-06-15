import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  userId: string;
}
