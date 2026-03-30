import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ description: 'Job ID' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Tasker ID' })
  @IsUUID()
  taskerId: string;

  @ApiProperty({ description: 'Accepted price' })
  @IsNumber()
  acceptedPrice: number;
}
