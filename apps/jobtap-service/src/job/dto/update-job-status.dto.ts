import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { JobStatus } from '../../../../../libs/database/src/entities/job.entity';

export class UpdateJobStatusDto {
  @ApiProperty({ description: 'Job status', enum: JobStatus })
  @IsEnum(JobStatus)
  status: JobStatus;
}
