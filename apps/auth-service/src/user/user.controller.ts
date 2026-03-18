import { Controller, Get, Put, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../../../libs/guards/src/jwt-auth.guard';
import { UpdateProfileDto, AddAddressDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Get all user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved' })
  async getAddresses(@Request() req) {
    return this.userService.getAddresses(req.user.userId);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Add a new address' })
  @ApiResponse({ status: 201, description: 'Address added successfully' })
  async addAddress(@Request() req, @Body() dto: AddAddressDto) {
    return this.userService.addAddress(req.user.userId, dto);
  }

  @Put('addresses/:id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  async updateAddress(@Request() req, @Param('id') id: string, @Body() dto: AddAddressDto) {
    return this.userService.updateAddress(req.user.userId, id, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  async deleteAddress(@Request() req, @Param('id') id: string) {
    return this.userService.deleteAddress(req.user.userId, id);
  }
}
