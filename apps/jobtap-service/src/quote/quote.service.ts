import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobQuote, QuoteStatus } from '../../../../libs/database/src/entities/job-quote.entity';
import { Job, JobStatus } from '../../../../libs/database/src/entities/job.entity';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';
import { SubmitQuoteDto } from './dto/submit-quote.dto';

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  constructor(
    @InjectRepository(JobQuote)
    private quoteRepository: Repository<JobQuote>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(TaskerProfile)
    private taskerRepository: Repository<TaskerProfile>,
  ) {}

  /**
   * Submit a quote for a job
   */
  async submitQuote(dto: SubmitQuoteDto) {
    // Verify job exists and is open
    const job = await this.jobRepository.findOne({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${dto.jobId} not found`);
    }

    if (job.status !== JobStatus.POSTED && job.status !== JobStatus.QUOTED) {
      throw new BadRequestException('Job is not accepting quotes');
    }

    // Check if job has expired
    if (job.expiresAt && new Date() > job.expiresAt) {
      throw new BadRequestException('Job has expired');
    }

    // Verify tasker exists
    const tasker = await this.taskerRepository.findOne({
      where: { id: dto.taskerId },
    });

    if (!tasker) {
      throw new NotFoundException(`Tasker ${dto.taskerId} not found`);
    }

    // Check if tasker already submitted a quote
    const existingQuote = await this.quoteRepository.findOne({
      where: {
        jobId: dto.jobId,
        taskerId: dto.taskerId,
        status: QuoteStatus.PENDING,
      },
    });

    if (existingQuote) {
      throw new BadRequestException('You have already submitted a quote for this job');
    }

    // Create quote
    const quote = this.quoteRepository.create({
      jobId: dto.jobId,
      taskerId: dto.taskerId,
      price: dto.price,
      message: dto.message,
      status: QuoteStatus.PENDING,
    });

    await this.quoteRepository.save(quote);

    // Update job status to QUOTED if it was POSTED
    if (job.status === JobStatus.POSTED) {
      job.status = JobStatus.QUOTED;
      await this.jobRepository.save(job);
    }

    this.logger.log(`Quote ${quote.id} submitted by tasker ${dto.taskerId} for job ${dto.jobId}`);

    return this.findOne(quote.id);
  }

  /**
   * Get quote by ID
   */
  async findOne(id: string) {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['job', 'tasker', 'tasker.user'],
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }

    return {
      id: quote.id,
      jobId: quote.jobId,
      price: quote.price,
      message: quote.message,
      status: quote.status,
      tasker: {
        id: quote.tasker.id,
        name: quote.tasker.user.name,
        profilePicture: quote.tasker.profilePicture,
        rating: quote.tasker.rating,
        completedJobs: quote.tasker.completedJobs,
      },
      createdAt: quote.createdAt,
      acceptedAt: quote.acceptedAt,
      rejectedAt: quote.rejectedAt,
    };
  }

  /**
   * Get quotes for a job
   */
  async getJobQuotes(jobId: string) {
    const quotes = await this.quoteRepository.find({
      where: { jobId },
      relations: ['tasker', 'tasker.user'],
      order: { createdAt: 'DESC' },
    });

    return quotes.map(quote => ({
      id: quote.id,
      price: quote.price,
      message: quote.message,
      status: quote.status,
      tasker: {
        id: quote.tasker.id,
        name: quote.tasker.user.name,
        profilePicture: quote.tasker.profilePicture,
        rating: quote.tasker.rating,
        completedJobs: quote.tasker.completedJobs,
      },
      createdAt: quote.createdAt,
    }));
  }

  /**
   * Get quotes by tasker
   */
  async getTaskerQuotes(taskerId: string, status?: QuoteStatus) {
    const queryBuilder = this.quoteRepository.createQueryBuilder('quote');

    queryBuilder
      .where('quote.taskerId = :taskerId', { taskerId })
      .leftJoinAndSelect('quote.job', 'job')
      .leftJoinAndSelect('job.customer', 'customer')
      .orderBy('quote.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('quote.status = :status', { status });
    }

    const quotes = await queryBuilder.getMany();

    return quotes.map(quote => ({
      id: quote.id,
      jobId: quote.jobId,
      jobTitle: quote.job.title,
      price: quote.price,
      status: quote.status,
      customer: {
        id: quote.job.customer.id,
        name: quote.job.customer.name,
      },
      createdAt: quote.createdAt,
    }));
  }

  /**
   * Accept a quote
   */
  async acceptQuote(quoteId: string, customerId: string) {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: ['job'],
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }

    // Verify customer owns the job
    if (quote.job.customerId !== customerId) {
      throw new BadRequestException('You can only accept quotes for your own jobs');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Quote has already been processed');
    }

    // Accept the quote
    quote.status = QuoteStatus.ACCEPTED;
    quote.acceptedAt = new Date();
    await this.quoteRepository.save(quote);

    // Reject all other pending quotes for this job
    await this.quoteRepository.update(
      {
        jobId: quote.jobId,
        status: QuoteStatus.PENDING,
      },
      {
        status: QuoteStatus.REJECTED,
        rejectedAt: new Date(),
      },
    );

    this.logger.log(`Quote ${quoteId} accepted for job ${quote.jobId}`);

    return this.findOne(quoteId);
  }

  /**
   * Reject a quote
   */
  async rejectQuote(quoteId: string, customerId: string) {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: ['job'],
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }

    // Verify customer owns the job
    if (quote.job.customerId !== customerId) {
      throw new BadRequestException('You can only reject quotes for your own jobs');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Quote has already been processed');
    }

    quote.status = QuoteStatus.REJECTED;
    quote.rejectedAt = new Date();
    await this.quoteRepository.save(quote);

    this.logger.log(`Quote ${quoteId} rejected for job ${quote.jobId}`);

    return this.findOne(quoteId);
  }

  /**
   * Withdraw a quote
   */
  async withdrawQuote(quoteId: string, taskerId: string) {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
    });

    if (!quote) {
      throw new NotFoundException(`Quote ${quoteId} not found`);
    }

    if (quote.taskerId !== taskerId) {
      throw new BadRequestException('You can only withdraw your own quotes');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Quote has already been processed');
    }

    quote.status = QuoteStatus.WITHDRAWN;
    await this.quoteRepository.save(quote);

    this.logger.log(`Quote ${quoteId} withdrawn by tasker ${taskerId}`);

    return this.findOne(quoteId);
  }
}
