import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rider, OnlineStatus, RiderStatus } from '../../../../libs/database/src/entities/rider.entity';
import { RiderLocation } from '../../../../libs/database/src/entities/rider-location.entity';
import { Order } from '../../../../libs/database/src/entities/order.entity';

@Injectable()
export class RiderService {
  private readonly logger = new Logger(RiderService.name);

  constructor(
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
    @InjectRepository(RiderLocation)
    private riderLocationRepository: Repository<RiderLocation>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * Get rider by ID
   */
  async findOne(id: string) {
    const rider = await this.riderRepository.findOne({
      where: { id },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${id} not found`);
    }

    const location = await this.riderLocationRepository.findOne({
      where: { riderId: id },
      order: { updatedAt: 'DESC' },
    });

    return {
      ...rider,
      currentLocation: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        updatedAt: location.updatedAt,
      } : null,
    };
  }

  /**
   * Get available riders in a zone
   */
  async getAvailableRiders(zoneId?: string) {
    const queryBuilder = this.riderRepository.createQueryBuilder('rider');

    queryBuilder
      .where('rider.onlineStatus = :onlineStatus', { onlineStatus: OnlineStatus.ONLINE })
      .andWhere('rider.status = :status', { status: RiderStatus.ACTIVE });

    if (zoneId) {
      // Add zone filtering if needed
    }

    const riders = await queryBuilder.getMany();

    // Get locations for all riders
    const ridersWithLocation = await Promise.all(
      riders.map(async (rider) => {
        const location = await this.riderLocationRepository.findOne({
          where: { riderId: rider.id },
          order: { updatedAt: 'DESC' },
        });

        return {
          id: rider.id,
          name: rider.name,
          phone: rider.phone,
          vehicleType: rider.vehicleType,
          rating: rider.rating,
          completedDeliveries: rider.totalDeliveries,
          status: rider.status,
          currentLocation: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            updatedAt: location.updatedAt,
          } : null,
        };
      }),
    );

    return ridersWithLocation;
  }

  /**
   * Update rider status
   */
  async updateStatus(id: string, status: string) {
    const rider = await this.riderRepository.findOne({
      where: { id },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${id} not found`);
    }

    rider.onlineStatus = status as OnlineStatus;
    await this.riderRepository.save(rider);

    this.logger.log(`Rider ${id} status updated to ${status}`);

    return this.findOne(id);
  }

  /**
   * Update rider location
   */
  async updateLocation(id: string, latitude: number, longitude: number, heading?: number, speed?: number) {
    const rider = await this.riderRepository.findOne({
      where: { id },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${id} not found`);
    }

    let location = await this.riderLocationRepository.findOne({
      where: { riderId: id },
    });

    if (location) {
      location.latitude = latitude;
      location.longitude = longitude;
      location.heading = heading || 0;
      location.speed = speed || 0;
    } else {
      location = this.riderLocationRepository.create({
        riderId: id,
        latitude,
        longitude,
        heading: heading || 0,
        speed: speed || 0,
      });
    }

    await this.riderLocationRepository.save(location);

    this.logger.log(`Rider ${id} location updated`);

    return {
      riderId: id,
      latitude,
      longitude,
      heading: heading || 0,
      speed: speed || 0,
      updatedAt: location.updatedAt,
    };
  }

  /**
   * Get rider statistics
   */
  async getRiderStats(id: string) {
    const rider = await this.findOne(id);

    const totalDeliveries = await this.orderRepository.count({
      where: {
        riderId: id,
        status: 'delivered' as any,
      },
    });

    const activeDeliveries = await this.orderRepository.count({
      where: {
        riderId: id,
        status: ['assigned', 'picked_up', 'in_transit'] as any,
      },
    });

    const todayDeliveries = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.riderId = :riderId', { riderId: id })
      .andWhere('order.status = :status', { status: 'delivered' })
      .andWhere('DATE(order.deliveredAt) = CURRENT_DATE')
      .getCount();

    return {
      riderId: id,
      riderName: rider.name,
      totalDeliveries,
      activeDeliveries,
      todayDeliveries,
      rating: rider.rating,
      status: rider.status,
    };
  }
}
