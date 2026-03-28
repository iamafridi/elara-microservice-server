import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CompleteAssignmentDto } from './dto/complete-assignment.dto';

@ApiTags('Assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create job assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created' })
  createAssignment(@Body() dto: CreateAssignmentDto) {
    return this.assignmentService.createAssignment(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiResponse({ status: 200, description: 'Assignment details' })
  getAssignment(@Param('id') id: string) {
    return this.assignmentService.findOne(id);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get assignment by job ID' })
  @ApiResponse({ status: 200, description: 'Assignment details' })
  getByJobId(@Param('jobId') jobId: string) {
    return this.assignmentService.getByJobId(jobId);
  }

  @Get('tasker/:taskerId')
  @ApiOperation({ summary: 'Get tasker assignments' })
  @ApiResponse({ status: 200, description: 'Tasker assignments' })
  @ApiQuery({ name: 'completed', required: false, type: Boolean })
  getTaskerAssignments(
    @Param('taskerId') taskerId: string,
    @Query('completed') completed?: string,
  ) {
    const isCompleted = completed ? completed === 'true' : undefined;
    return this.assignmentService.getTaskerAssignments(taskerId, isCompleted);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Start job' })
  @ApiResponse({ status: 200, description: 'Job started' })
  startJob(@Param('id') id: string, @Query('taskerId') taskerId: string) {
    return this.assignmentService.startJob(id, taskerId);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Complete job' })
  @ApiResponse({ status: 200, description: 'Job completed' })
  completeJob(
    @Param('id') id: string,
    @Query('taskerId') taskerId: string,
    @Body() dto: CompleteAssignmentDto,
  ) {
    return this.assignmentService.completeJob(id, taskerId, dto);
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Verify job completion' })
  @ApiResponse({ status: 200, description: 'Job verified' })
  verifyCompletion(@Param('id') id: string, @Query('customerId') customerId: string) {
    return this.assignmentService.verifyCompletion(id, customerId);
  }
}
