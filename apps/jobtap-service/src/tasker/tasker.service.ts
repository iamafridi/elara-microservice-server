import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskerProfile } from '../../../../libs/database/src/entities/tasker-profile.entity';
import { User } from '../../../../libs/database/src/entities/user.entity';

@Injectable()
export class TaskerService {
  private readonly logger = new Logger(TaskerService.name);

  constructor(
    @InjectRepository(TaskerProfile)
    private taskerRepository: Repository<TaskerProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get tasker profile by ID
   */
  async findOne(id: string) {
    const tasker = await this.taskerRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!tasker) {
      throw new NotFoundException(`Tasker ${id} not found`);
    }

    return {
      id: tasker.id,
      name: tasker.user.name,
      email: tasker.user.email,
      phone: tasker.user.phone,
      bio: tasker.bio,
      hourlyRate: tasker.hourlyRate,
      fixedRateEnabled: tasker.fixedRateEnabled,
      serviceRadiusMiles: tasker.serviceRadiusMiles,
      skills: tasker.skills,
      availability: tasker.availability,
      rating: tasker.rating,
      totalJobs: tasker.totalJobs,
      completedJobs: tasker.completedJobs,
      totalReviews: tasker.totalReviews,
      profileVerified: tasker.profileVerified,
      status: tasker.status,
      profilePicture: tasker.profilePicture,
      createdAt: tasker.createdAt,
    };
  }

  /**
   * Get tasker by user ID
   */
  async findByUserId(userId: string) {
    const tasker = await this.taskerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!tasker) {
      throw new NotFoundException(`No tasker profile found for user ${userId}`);
    }

    return this.findOne(tasker.id);
  }

  /**
   * Search taskers near location
   */
  async searchNearby(latitude: number, longitude: number, skills?: string[], radiusMiles: number = 25) {
    const queryBuilder = this.taskerRepository.createQueryBuilder('tasker');

    queryBuilder
      .where('tasker.status = :status', { status: 'active' })
      .andWhere('tasker.profileVerified = :verified', { verified: true })
      .leftJoinAndSelect('tasker.user', 'user');

    if (skills && skills.length > 0) {
      queryBuilder.andWhere('tasker.skills && :skills', { skills });
    }

    const taskers = await queryBuilder.getMany();

    // Filter by distance and service radius
    const nearbyTaskers = taskers
      .filter(tasker => {
        // For simplicity, we're not calculating actual distance here
        // In production, you'd use PostGIS or similar
        return tasker.serviceRadiusMiles >= radiusMiles;
      })
      .map(tasker => ({
        id: tasker.id,
        name: tasker.user.name,
        profilePicture: tasker.profilePicture,
        hourlyRate: tasker.hourlyRate,
        skills: tasker.skills,
        rating: tasker.rating,
        completedJobs: tasker.completedJobs,
      }));

    return nearbyTaskers;
  }
}
