import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobAssignment } from '../../../../libs/database/src/entities/job-assignment.entity';
import { Job, JobStatus } from '../../../../libs/database/src/entities/job.entity';
import { JobQuote, QuoteStatus } from '../../../../libs/database/src/entities/job-quote.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { CompleteAssignmentDto } from './dto/complete-assignment.dto';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    @InjectRepository(JobAssignment)
    private assignmentRepository: Repository<JobAssignment>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(JobQuote)
    private quoteRepository: Repository<JobQuote>,
    @InjectRepository(TaskerProfile)
    private taskerRepository: Repository<TaskerProfile>,
  ) {}

  /**
   * Create job assignment from accepted quote
   */
  async createAssignment(dto: CreateAssignmentDto) {
    // Verify job exists
    const job = await this.jobRepository.findOne({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${dto.jobId} not found`);
    }

    // Check if job already has an assignment
    const existingAssignment = await this.assignmentRepository.findOne({
      where: { jobId: dto.jobId },
    });

    if (existingAssignment) {
      throw new BadRequestException('Job already has an assignment');
    }

    // Verify tasker exists
    const tasker = await this.taskerRepository.findOne({
      where: { id: dto.taskerId },
    });

    if (!tasker) {
      throw new NotFoundException(`Tasker ${dto.taskerId} not found`);
    }

    // Verify there's an accepted quote
    const acceptedQuote = await this.quoteRepository.findOne({
      where: {
        jobId: dto.jobId,
        taskerId: dto.taskerId,
        status: QuoteStatus.ACCEPTED,
      },
    });

    if (!acceptedQuote) {
      throw new BadRequestException('No accepted quote found for this job and tasker');
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      jobId: dto.jobId,
      taskerId: dto.taskerId,
      acceptedPrice: dto.acceptedPrice,
    });

    await this.assignmentRepository.save(assignment);

    // Update job status
    job.status = JobStatus.ASSIGNED;
    await this.jobRepository.save(job);

    // Update tasker stats
    tasker.totalJobs += 1;
    await this.taskerRepository.save(tasker);

    this.logger.log(`Job ${dto.jobId} assigned to tasker ${dto.taskerId}`);

    return this.findOne(assignment.id);
  }

  /**
   * Get assignment by ID
   */
  async findOne(id: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }

    // Get related data
    const job = await this.jobRepository.findOne({
      where: { id: assignment.jobId },
      relations: ['customer', 'category'],
    });

    const tasker = await this.taskerRepository.findOne({
      where: { id: assignment.taskerId },
      relations: ['user'],
    });

    return {
      id: assignment.id,
      job: {
        id: job.id,
        title: job.title,
        description: job.description,
        address: job.address,
        customer: {
          id: job.customer.id,
          name: job.customer.name,
          phone: job.customer.phone,
        },
        category: {
          id: job.category.id,
          name: job.category.name,
        },
      },
      tasker: {
        id: tasker.id,
        name: tasker.user.name,
        phone: tasker.user.phone,
        profilePicture: tasker.profilePicture,
        rating: tasker.rating,
      },
      acceptedPrice: assignment.acceptedPrice,
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      isCompleted: assignment.isCompleted,
      customerVerified: assignment.customerVerified,
      completionNotes: assignment.completionNotes,
      createdAt: assignment.createdAt,
    };
  }

  /**
   * Get assignment by job ID
   */
  async getByJobId(jobId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { jobId },
    });

    if (!assignment) {
      throw new NotFoundException(`No assignment found for job ${jobId}`);
    }

    return this.findOne(assignment.id);
  }

  /**
   * Get assignments for a tasker
   */
  async getTaskerAssignments(taskerId: string, completed?: boolean) {
    const queryBuilder = this.assignmentRepository.createQueryBuilder('assignment');

    queryBuilder.where('assignment.taskerId = :taskerId', { taskerId });

    if (completed !== undefined) {
      queryBuilder.andWhere('assignment.isCompleted = :completed', { completed });
    }

    const assignments = await queryBuilder.getMany();

    return Promise.all(
      assignments.map(async (assignment) => {
        const job = await this.jobRepository.findOne({
          where: { id: assignment.jobId },
          relations: ['customer'],
        });

        return {
          id: assignment.id,
          jobId: job.id,
          jobTitle: job.title,
          customer: {
            id: job.customer.id,
            name: job.customer.name,
          },
          acceptedPrice: assignment.acceptedPrice,
          isCompleted: assignment.isCompleted,
          startTime: assignment.startTime,
          endTime: assignment.endTime,
          createdAt: assignment.createdAt,
        };
      }),
    );
  }

  /**
   * Start job
   */
  async startJob(assignmentId: string, taskerId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${assignmentId} not found`);
    }

    if (assignment.taskerId !== taskerId) {
      throw new BadRequestException('You can only start your own assignments');
    }

    if (assignment.startTime) {
      throw new BadRequestException('Job has already been started');
    }

    assignment.startTime = new Date();
    await this.assignmentRepository.save(assignment);

    // Update job status
    const job = await this.jobRepository.findOne({
      where: { id: assignment.jobId },
    });

    if (job) {
      job.status = JobStatus.IN_PROGRESS;
      await this.jobRepository.save(job);
    }

    this.logger.log(`Assignment ${assignmentId} started by tasker ${taskerId}`);

    return this.findOne(assignmentId);
  }

  /**
   * Complete job
   */
  async completeJob(assignmentId: string, taskerId: string, dto: CompleteAssignmentDto) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${assignmentId} not found`);
    }

    if (assignment.taskerId !== taskerId) {
      throw new BadRequestException('You can only complete your own assignments');
    }

    if (!assignment.startTime) {
      throw new BadRequestException('Job has not been started yet');
    }

    if (assignment.isCompleted) {
      throw new BadRequestException('Job has already been completed');
    }

    assignment.endTime = new Date();
    assignment.isCompleted = true;
    assignment.completionNotes = dto.completionNotes;
    await this.assignmentRepository.save(assignment);

    // Update job status
    const job = await this.jobRepository.findOne({
      where: { id: assignment.jobId },
    });

    if (job) {
      job.status = JobStatus.COMPLETED;
      await this.jobRepository.save(job);
    }

    this.logger.log(`Assignment ${assignmentId} completed by tasker ${taskerId}`);

    return this.findOne(assignmentId);
  }

  /**
   * Verify job completion (by customer)
   */
  async verifyCompletion(assignmentId: string, customerId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment ${assignmentId} not found`);
    }

    const job = await this.jobRepository.findOne({
      where: { id: assignment.jobId },
    });

    if (!job || job.customerId !== customerId) {
      throw new BadRequestException('You can only verify your own jobs');
    }

    if (!assignment.isCompleted) {
      throw new BadRequestException('Job has not been completed yet');
    }

    if (assignment.customerVerified) {
      throw new BadRequestException('Job has already been verified');
    }

    assignment.customerVerified = true;
    await this.assignmentRepository.save(assignment);

    // Update tasker stats
    const tasker = await this.taskerRepository.findOne({
      where: { id: assignment.taskerId },
    });

    if (tasker) {
      tasker.completedJobs += 1;
      await this.taskerRepository.save(tasker);
    }

    this.logger.log(`Assignment ${assignmentId} verified by customer ${customerId}`);

    return this.findOne(assignmentId);
  }
}
