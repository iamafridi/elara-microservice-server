import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../../../../libs/database/src/entities/job.entity';
import { JobCategory } from '../../../../libs/database/src/entities/job-category.entity';
import { User } from '../../../../libs/database/src/entities/user.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(JobCategory)
    private categoryRepository: Repository<JobCategory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new job posting
   */
  async createJob(dto: CreateJobDto) {
    // Verify customer exists
    const customer = await this.userRepository.findOne({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${dto.customerId} not found`);
    }

    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${dto.categoryId} not found`);
    }

    // Create job with expiration date (30 days default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const job = this.jobRepository.create({
      customerId: dto.customerId,
      categoryId: dto.categoryId,
      subcategoryId: dto.subcategoryId,
      title: dto.title,
      description: dto.description,
      photos: dto.photos || [],
      videos: dto.videos || [],
      address: dto.address,
      city: dto.city,
      postcode: dto.postcode,
      latitude: dto.latitude,
      longitude: dto.longitude,
      budgetType: dto.budgetType,
      budgetAmount: dto.budgetAmount,
      radiusMiles: dto.radiusMiles || 15,
      isPublic: dto.isPublic ?? true,
      preferredStartDate: dto.preferredStartDate ? new Date(dto.preferredStartDate) : null,
      expiresAt,
      status: JobStatus.POSTED,
    });

    await this.jobRepository.save(job);

    this.logger.log(`Job ${job.id} created by customer ${dto.customerId}`);

    return this.findOne(job.id);
  }

  /**
   * Get job by ID
   */
  async findOne(id: string) {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['customer', 'category', 'quotes'],
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      photos: job.photos,
      videos: job.videos,
      address: job.address,
      city: job.city,
      postcode: job.postcode,
      location: {
        latitude: job.latitude,
        longitude: job.longitude,
      },
      budgetType: job.budgetType,
      budgetAmount: job.budgetAmount,
      radiusMiles: job.radiusMiles,
      status: job.status,
      preferredStartDate: job.preferredStartDate,
      expiresAt: job.expiresAt,
      customer: {
        id: job.customer.id,
        name: job.customer.name,
        profilePicture: job.customer.profilePicture,
      },
      category: {
        id: job.category.id,
        name: job.category.name,
        icon: job.category.icon,
      },
      quotesCount: job.quotes?.length || 0,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /**
   * Get jobs by customer
   */
  async getCustomerJobs(customerId: string, status?: JobStatus) {
    const queryBuilder = this.jobRepository.createQueryBuilder('job');

    queryBuilder
      .where('job.customerId = :customerId', { customerId })
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.quotes', 'quotes')
      .orderBy('job.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    const jobs = await queryBuilder.getMany();

    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      budgetType: job.budgetType,
      budgetAmount: job.budgetAmount,
      status: job.status,
      category: {
        id: job.category.id,
        name: job.category.name,
      },
      quotesCount: job.quotes?.length || 0,
      createdAt: job.createdAt,
    }));
  }

  /**
   * Search jobs near location
   */
  async searchNearbyJobs(latitude: number, longitude: number, categoryId?: string, radiusMiles: number = 25) {
    const queryBuilder = this.jobRepository.createQueryBuilder('job');

    queryBuilder
      .where('job.status = :status', { status: JobStatus.POSTED })
      .andWhere('job.isPublic = :isPublic', { isPublic: true })
      .andWhere('job.expiresAt > :now', { now: new Date() })
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.customer', 'customer');

    if (categoryId) {
      queryBuilder.andWhere('job.categoryId = :categoryId', { categoryId });
    }

    const jobs = await queryBuilder.getMany();

    // Filter by distance
    const nearbyJobs = jobs.filter(job => {
      const distance = this.calculateDistance(latitude, longitude, job.latitude, job.longitude);
      return distance <= Math.min(radiusMiles, job.radiusMiles);
    }).map(job => {
      const distance = this.calculateDistance(latitude, longitude, job.latitude, job.longitude);
      return {
        id: job.id,
        title: job.title,
        description: job.description,
        budgetType: job.budgetType,
        budgetAmount: job.budgetAmount,
        category: {
          id: job.category.id,
          name: job.category.name,
          icon: job.category.icon,
        },
        customer: {
          id: job.customer.id,
          name: job.customer.name,
        },
        distance: Math.round(distance * 10) / 10,
        createdAt: job.createdAt,
      };
    });

    // Sort by distance
    nearbyJobs.sort((a, b) => a.distance - b.distance);

    return nearbyJobs;
  }

  /**
   * Update job status
   */
  async updateStatus(id: string, dto: UpdateJobStatusDto) {
    const job = await this.jobRepository.findOne({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    job.status = dto.status;
    await this.jobRepository.save(job);

    this.logger.log(`Job ${id} status updated to ${dto.status}`);

    return this.findOne(id);
  }

  /**
   * Cancel job
   */
  async cancelJob(id: string, customerId: string) {
    const job = await this.jobRepository.findOne({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    if (job.customerId !== customerId) {
      throw new BadRequestException('You can only cancel your own jobs');
    }

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Job cannot be cancelled');
    }

    job.status = JobStatus.CANCELLED;
    await this.jobRepository.save(job);

    this.logger.log(`Job ${id} cancelled by customer ${customerId}`);

    return this.findOne(id);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
