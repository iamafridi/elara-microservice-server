import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserAddress } from '../../../../libs/database/src/entities';
import { EventPublisher } from '../../../../libs/events/src/event-publisher.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserAddress)
    private addressRepository: Repository<UserAddress>,
    private eventPublisher: EventPublisher,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['addresses'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const { passwordHash, ...profile } = user;

    return profile;
  }

  async updateProfile(userId: string, updateData: Partial<User>) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent updating sensitive fields
    delete updateData.passwordHash;
    delete updateData.role;
    delete updateData.status;

    Object.assign(user, updateData);
    await this.userRepository.save(user);

    await this.eventPublisher.publish('user.profile_updated', {
      userId,
      updates: Object.keys(updateData),
    });

    const { passwordHash, ...profile } = user;
    return profile;
  }

  async addAddress(userId: string, addressData: Partial<UserAddress>) {
    // If this is the first address or marked as default, set all others to non-default
    if (addressData.isDefault) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    const address = this.addressRepository.create({
      ...addressData,
      userId,
    });

    await this.addressRepository.save(address);

    return address;
  }

  async updateAddress(userId: string, addressId: string, addressData: Partial<UserAddress>) {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // If setting as default, unset all other addresses
    if (addressData.isDefault) {
      await this.addressRepository.update({ userId }, { isDefault: false });
    }

    Object.assign(address, addressData);
    await this.addressRepository.save(address);

    return address;
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressRepository.remove(address);

    return { message: 'Address deleted successfully' };
  }

  async getAddresses(userId: string) {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }
}
