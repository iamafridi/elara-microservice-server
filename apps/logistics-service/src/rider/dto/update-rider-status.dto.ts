import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OnlineStatus } from '../../../../../libs/database/src/entities/rider.entity';

export class UpdateRiderStatusDto {
  @ApiProperty({ description: 'Rider online status', enum: OnlineStatus })
  @IsEnum(OnlineStatus)
  status: OnlineStatus;
}
