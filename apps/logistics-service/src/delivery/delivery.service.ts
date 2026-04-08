import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Rider, OnlineStatus } from '../../../../libs/database/src/entities/rider.entity';
import { RiderLocation } from '../../../../libs/database/src/entities/rider-location.entity';
import { AssignRiderDto } from './dto/assign-rider.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
    @InjectRepository(RiderLocation)
    private riderLocationRepository: Repository<RiderLocation>,
  ) {}

  /**
   * Assign rider to order
   */
  async assignRider(orderId: string, dto: AssignRiderDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== 'ready' && order.status !== 'pending') {
      throw new BadRequestException('Order is not ready for assignment');
    }

    const rider = await this.riderRepository.findOne({
      where: { id: dto.riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${dto.riderId} not found`);
    }

    if (rider.onlineStatus !== OnlineStatus.ONLINE) {
      throw new BadRequestException('Rider is not available');
    }

    // Assign rider to order
    order.riderId = dto.riderId;
    order.status = 'assigned' as any;
    order.assignedAt = new Date();

    await this.orderRepository.save(order);

    // Update rider status
    rider.onlineStatus = OnlineStatus.BUSY;
    await this.riderRepository.save(rider);

    this.logger.log(`Rider ${dto.riderId} assigned to order ${orderId}`);

    return this.getDeliveryDetails(orderId);
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(orderId: string, dto: UpdateDeliveryStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['rider'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (!order.riderId) {
      throw new BadRequestException('Order has no assigned rider');
    }

    // Update order status based on delivery status
    switch (dto.status) {
      case 'picked_up':
        order.status = 'picked_up' as any;
        order.pickedAt = new Date();
        break;
      case 'in_transit':
        order.status = 'in_transit' as any;
        break;
      case 'delivered':
        order.status = 'delivered' as any;
        order.deliveredAt = new Date();
        // Update rider status back to available
        if (order.rider) {
          order.rider.onlineStatus = OnlineStatus.ONLINE;
          await this.riderRepository.save(order.rider);
        }
        break;
      case 'failed':
        order.status = 'cancelled' as any;
        order.cancelledAt = new Date();
        order.cancellationReason = dto.notes || 'Delivery failed';
        // Update rider status back to available
        if (order.rider) {
          order.rider.onlineStatus = OnlineStatus.ONLINE;
          await this.riderRepository.save(order.rider);
        }
        break;
    }

    await this.orderRepository.save(order);

    // Update rider location if provided
    if (dto.latitude && dto.longitude && order.riderId) {
      await this.updateRiderLocation(order.riderId, dto.latitude, dto.longitude);
    }

    this.logger.log(`Delivery status updated for order ${orderId}: ${dto.status}`);

    return this.getDeliveryDetails(orderId);
  }

  /**
   * Get delivery details
   */
  async getDeliveryDetails(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['rider', 'merchant', 'customer'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    let riderLocation = null;
    if (order.riderId) {
      riderLocation = await this.riderLocationRepository.findOne({
        where: { riderId: order.riderId },
        order: { updatedAt: 'DESC' },
      });
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      rider: order.rider ? {
        id: order.rider.id,
        name: order.rider.name,
        phone: order.rider.phone,
        currentLocation: riderLocation ? {
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          updatedAt: riderLocation.updatedAt,
        } : null,
      } : null,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
      },
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: {
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
      },
      estimatedDeliveryTime: order.estimatedDeliveryTimeMinutes,
      assignedAt: order.assignedAt,
      pickedAt: order.pickedAt,
      deliveredAt: order.deliveredAt,
    };
  }

  /**
   * Get active deliveries for a rider
   */
  async getRiderActiveDeliveries(riderId: string) {
    const orders = await this.orderRepository.find({
      where: {
        riderId,
        status: ['assigned', 'picked_up', 'in_transit'] as any,
      },
      relations: ['merchant'],
      order: { createdAt: 'DESC' },
    });

    return orders.map(order => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      merchant: order.merchant ? {
        id: order.merchant.id,
        name: order.merchant.storeName,
        address: order.merchant.address,
      } : null,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: {
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
      },
      total: order.total,
      assignedAt: order.assignedAt,
      pickedAt: order.pickedAt,
    }));
  }

  /**
   * Get pending deliveries (unassigned orders)
   */
  async getPendingDeliveries(zoneId?: string) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    queryBuilder
      .where('order.riderId IS NULL')
      .andWhere('order.status IN (:...statuses)', { statuses: ['ready', 'pending'] })
      .leftJoinAndSelect('order.merchant', 'merchant')
      .orderBy('order.createdAt', 'ASC');

    const orders = await queryBuilder.getMany();

    return orders.map(order => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      merchant: order.merchant ? {
        id: order.merchant.id,
        name: order.merchant.storeName,
        address: order.merchant.address,
      } : null,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: {
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
      },
      total: order.total,
      createdAt: order.createdAt,
    }));
  }

  /**
   * Update rider location
   */
  private async updateRiderLocation(riderId: string, latitude: number, longitude: number) {
    let location = await this.riderLocationRepository.findOne({
      where: { riderId },
    });

    if (location) {
      location.latitude = latitude;
      location.longitude = longitude;
      location.heading = 0;
      location.speed = 0;
    } else {
      location = this.riderLocationRepository.create({
        riderId,
        latitude,
        longitude,
        heading: 0,
        speed: 0,
      });
    }

    await this.riderLocationRepository.save(location);
  }
}
