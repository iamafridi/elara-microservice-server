import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../../../libs/database/src/entities/admin-user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
  ) {}

  async create(createDto: CreateAdminUserDto) {
    // Check if email already exists
    const existingAdmin = await this.adminUserRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin user with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createDto.password, saltRounds);

    const adminUser = this.adminUserRepository.create({
      name: createDto.name,
      email: createDto.email,
      passwordHash,
      role: createDto.role,
      permissions: createDto.permissions || [],
      isActive: true,
    });

    await this.adminUserRepository.save(adminUser);

    return this.findOne(adminUser.id);
  }

  async findAll() {
    const adminUsers = await this.adminUserRepository.find({
      order: { createdAt: 'DESC' },
    });

    return adminUsers.map(admin => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
    }));
  }

  async findOne(id: string) {
    const adminUser = await this.adminUserRepository.findOne({ where: { id } });

    if (!adminUser) {
      throw new NotFoundException(`Admin user ${id} not found`);
    }

    return {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions,
      isActive: adminUser.isActive,
      lastLogin: adminUser.lastLogin,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt,
    };
  }

  async update(id: string, updateDto: UpdateAdminUserDto) {
    const adminUser = await this.adminUserRepository.findOne({ where: { id } });

    if (!adminUser) {
      throw new NotFoundException(`Admin user ${id} not found`);
    }

    if (updateDto.name) adminUser.name = updateDto.name;
    if (updateDto.role) adminUser.role = updateDto.role;
    if (updateDto.permissions !== undefined) adminUser.permissions = updateDto.permissions;
    if (updateDto.isActive !== undefined) adminUser.isActive = updateDto.isActive;

    await this.adminUserRepository.save(adminUser);

    return this.findOne(id);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const adminUser = await this.adminUserRepository.findOne({ where: { id } });

    if (!adminUser) {
      throw new NotFoundException(`Admin user ${id} not found`);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      adminUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, saltRounds);

    adminUser.passwordHash = newPasswordHash;
    await this.adminUserRepository.save(adminUser);

    return { message: 'Password changed successfully' };
  }

  async delete(id: string) {
    const adminUser = await this.adminUserRepository.findOne({ where: { id } });

    if (!adminUser) {
      throw new NotFoundException(`Admin user ${id} not found`);
    }

    await this.adminUserRepository.remove(adminUser);

    return { message: 'Admin user deleted successfully' };
  }

  async getAdminStats() {
    const totalAdmins = await this.adminUserRepository.count();

    const adminsByRole = await this.adminUserRepository
      .createQueryBuilder('admin')
      .select('admin.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('admin.role')
      .getRawMany();

    const activeAdmins = await this.adminUserRepository.count({
      where: { isActive: true },
    });

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins: totalAdmins - activeAdmins,
      byRole: adminsByRole.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }
}
