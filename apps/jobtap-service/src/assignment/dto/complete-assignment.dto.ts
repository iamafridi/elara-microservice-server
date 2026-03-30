import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CompleteAssignmentDto {
  @ApiProperty({ description: 'Completion notes', required: false })
  @IsString()
  @IsOptional()
  completionNotes?: string;
}
