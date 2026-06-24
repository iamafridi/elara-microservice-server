import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Job, JobStatus } from '../../../../libs/database/src/entities/job.entity';

export interface JobSearchParams {
  query?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  minBudget?: number;
  maxBudget?: number;
  budgetType?: string;
  sortBy?: 'budget' | 'date' | 'distance';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

@Injectable()
export class JobSearchService {
  private readonly logger = new Logger(JobSearchService.name);

  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  /**
   * Search jobs with filters
   */
  async searchJobs(params: JobSearchParams) {
    const {
      query,
      categoryId,
      latitude,
      longitude,
      radiusMiles = 25,
      minBudget,
      maxBudget,
      budgetType,
      sortBy = 'date',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0,
    } = params;

    const queryBuilder = this.jobRepository.createQueryBuilder('job');

    // Base filters - only show posted/quoted jobs
    queryBuilder
      .where('job.status IN (:...statuses)', { statuses: [JobStatus.POSTED, JobStatus.QUOTED] })
      .andWhere('job.isPublic = :isPublic', { isPublic: true })
      .andWhere('job.expiresAt > :now', { now: new Date() })
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.customer', 'customer');

    // Text search
    if (query) {
      queryBuilder.andWhere(
        '(job.title ILIKE :query OR job.description ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('job.categoryId = :categoryId', { categoryId });
    }

    // Budget range filter
    if (minBudget !== undefined) {
      queryBuilder.andWhere('job.budgetAmount >= :minBudget', { minBudget });
    }
    if (maxBudget !== undefined) {
      queryBuilder.andWhere('job.budgetAmount <= :maxBudget', { maxBudget });
    }

    // Budget type filter
    if (budgetType) {
      queryBuilder.andWhere('job.budgetType = :budgetType', { budgetType });
    }

    // Sorting
    switch (sortBy) {
      case 'budget':
        queryBuilder.orderBy('job.budgetAmount', sortOrder);
        break;
      case 'distance':
        // Distance sorting will be done after fetching
        queryBuilder.orderBy('job.createdAt', 'DESC');
        break;
      default:
        queryBuilder.orderBy('job.createdAt', sortOrder);
    }

    // Pagination
    queryBuilder.skip(offset).take(limit * 2); // Fetch more for distance filtering

    const jobs = await queryBuilder.getMany();

    // Calculate distance and filter
    const results = jobs
      .map(job => {
        let distance = null;
        if (latitude !== undefined && longitude !== undefined) {
          distance = this.calculateDistance(latitude, longitude, job.latitude, job.longitude);
        }

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          address: job.address,
          city: job.city,
          location: {
            latitude: job.latitude,
            longitude: job.longitude,
          },
          budgetType: job.budgetType,
          budgetAmount: job.budgetAmount,
          status: job.status,
          category: job.category ? {
            id: job.category.id,
            name: job.category.name,
            icon: job.category.icon,
          } : null,
          customer: {
            id: job.customer.id,
            name: job.customer.name,
          },
          preferredStartDate: job.preferredStartDate,
          distance: distance ? Math.round(distance * 10) / 10 : null,
          createdAt: job.createdAt,
        };
      })
      .filter(job => {
        if (latitude !== undefined && longitude !== undefined) {
          return job.distance !== null && job.distance <= radiusMiles;
        }
        return true;
      });

    // Sort by distance if requested
    if (sortBy === 'distance' && latitude !== undefined && longitude !== undefined) {
      results.sort((a, b) => {
        const distA = a.distance || 999999;
        const distB = b.distance || 999999;
        return sortOrder === 'ASC' ? distA - distB : distB - distA;
      });
    }

    // Apply pagination after filtering
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      data: paginatedResults,
      total: results.length,
      limit,
      offset,
      hasMore: offset + paginatedResults.length < results.length,
    };
  }

  /**
   * Get job autocomplete suggestions
   */
  async autocomplete(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const jobs = await this.jobRepository.find({
      where: [
        { title: ILike(`%${query}%`), status: JobStatus.POSTED, isPublic: true },
      ],
      select: ['id', 'title', 'budgetAmount', 'budgetType'],
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      budgetAmount: job.budgetAmount,
      budgetType: job.budgetType,
    }));
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
