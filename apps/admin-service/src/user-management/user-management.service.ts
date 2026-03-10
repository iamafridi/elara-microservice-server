import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../libs/database/src/entities/user.entity';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(queryDto: QueryUsersDto) {
    const { role, status, search, page = 1, limit = 20 } = queryDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Filter by role
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Search by name, email, or phone
    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('user.createdAt', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      profilePicture: user.profilePicture,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateStatus(id: string, updateDto: UpdateUserStatusDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    user.status = updateDto.status;
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async updateRole(id: string, updateDto: UpdateUserRoleDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    user.role = updateDto.role;
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async getUserStats() {
    const totalUsers = await this.userRepository.count();

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const usersByStatus = await this.userRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany();

    // Get new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    return {
      totalUsers,
      byRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {}),
      byStatus: usersByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      newUsersLast30Days,
    };
  }
}
