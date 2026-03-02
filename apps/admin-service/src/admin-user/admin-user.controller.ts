import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUserService } from './admin-user.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin-users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new admin user' })
  @ApiResponse({ status: 201, description: 'Admin user created successfully' })
  @ApiResponse({ status: 409, description: 'Admin user already exists' })
  create(@Body() createDto: CreateAdminUserDto) {
    return this.adminUserService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all admin users' })
  @ApiResponse({ status: 200, description: 'Admin users retrieved successfully' })
  findAll() {
    return this.adminUserService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get admin user statistics' })
  @ApiResponse({ status: 200, description: 'Admin statistics retrieved successfully' })
  getStats() {
    return this.adminUserService.getAdminStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get admin user by ID' })
  @ApiResponse({ status: 200, description: 'Admin user retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  findOne(@Param('id') id: string) {
    return this.adminUserService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update admin user' })
  @ApiResponse({ status: 200, description: 'Admin user updated successfully' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAdminUserDto) {
    return this.adminUserService.update(id, updateDto);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: 'Change admin user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.adminUserService.changePassword(id, changePasswordDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete admin user' })
  @ApiResponse({ status: 200, description: 'Admin user deleted successfully' })
  @ApiResponse({ status: 404, description: 'Admin user not found' })
  delete(@Param('id') id: string) {
    return this.adminUserService.delete(id);
  }
}
