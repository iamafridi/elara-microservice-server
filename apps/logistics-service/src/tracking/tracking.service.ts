import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { RiderLocation } from '../../../../libs/database/src/entities/rider-location.entity';
import { MapboxService } from '../mapbox/mapbox.service';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private trackingGateway: any; // Will be injected after module initialization

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
    @InjectRepository(RiderLocation)
    private riderLocationRepository: Repository<RiderLocation>,
    private mapboxService: MapboxService,
  ) {}

  /**
   * Set tracking gateway (called by gateway on init to avoid circular dependency)
   */
  setTrackingGateway(gateway: any) {
    this.trackingGateway = gateway;
  }

  /**
   * Track order in real-time with enhanced ETA calculation
   */
  async trackOrder(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['rider', 'merchant'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    let riderLocation = null;
    let estimatedTimeMinutes = null;
    let estimatedArrivalTime = null;
    let distanceToDestination = null;

    if (order.riderId) {
      riderLocation = await this.riderLocationRepository.findOne({
        where: { riderId: order.riderId },
        order: { updatedAt: 'DESC' },
      });

      // Calculate ETA using Mapbox for accuracy (considers traffic)
      if (riderLocation && order.deliveryLatitude && order.deliveryLongitude) {
        try {
          const result = await this.mapboxService.getDistanceAndDuration(
            { latitude: riderLocation.latitude, longitude: riderLocation.longitude },
            { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
            'driving-traffic',
          );

          distanceToDestination = Math.round(result.distance); // meters
          estimatedTimeMinutes = Math.ceil(result.duration / 60); // seconds to minutes

          // Calculate estimated arrival time
          estimatedArrivalTime = new Date(Date.now() + result.duration * 1000);
        } catch (error) {
          this.logger.warn(`Failed to get Mapbox ETA for order ${orderId}, falling back to simple calculation`);
          // Fallback to simple calculation
          const distance = this.calculateDistance(
            riderLocation.latitude,
            riderLocation.longitude,
            order.deliveryLatitude,
            order.deliveryLongitude,
          );
          distanceToDestination = Math.round(distance * 1000); // km to meters
          estimatedTimeMinutes = Math.ceil((distance / 30) * 60);
        }
      }
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      merchant: order.merchant ? {
        name: order.merchant.storeName,
        address: order.merchant.address,
        location: {
          latitude: order.merchant.latitude,
          longitude: order.merchant.longitude,
        },
      } : null,
      deliveryAddress: order.deliveryAddress,
      deliveryLocation: {
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
      },
      rider: order.rider ? {
        id: order.rider.id,
        name: order.rider.name,
        phone: order.rider.phone,
        vehicleType: order.rider.vehicleType,
        currentLocation: riderLocation ? {
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          heading: riderLocation.heading,
          speed: riderLocation.speed,
          updatedAt: riderLocation.updatedAt,
        } : null,
      } : null,
      estimatedTimeMinutes,
      estimatedArrivalTime,
      distanceToDestination,
      timeline: {
        ordered: order.createdAt,
        assigned: order.assignedAt,
        pickedUp: order.pickedAt,
        delivered: order.deliveredAt,
      },
    };
  }

  /**
   * Get rider current location
   */
  async getRiderLocation(riderId: string) {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${riderId} not found`);
    }

    const location = await this.riderLocationRepository.findOne({
      where: { riderId },
      order: { updatedAt: 'DESC' },
    });

    if (!location) {
      throw new NotFoundException(`Location for rider ${riderId} not found`);
    }

    return {
      riderId,
      riderName: rider.name,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading,
      speed: location.speed,
      updatedAt: location.updatedAt,
    };
  }

  /**
   * Get delivery route (simplified - returns pickup and delivery points)
   */
  async getDeliveryRoute(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['merchant', 'rider'],
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

    const waypoints = [];

    // Add rider current location if available
    if (riderLocation) {
      waypoints.push({
        type: 'current',
        name: 'Current Location',
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
      });
    }

    // Add pickup location (merchant)
    if (order.merchant && order.status !== 'delivered' && order.status !== 'in_transit') {
      waypoints.push({
        type: 'pickup',
        name: order.merchant.storeName,
        latitude: order.merchant.latitude,
        longitude: order.merchant.longitude,
      });
    }

    // Add delivery location
    waypoints.push({
      type: 'delivery',
      name: 'Delivery Location',
      latitude: order.deliveryLatitude,
      longitude: order.deliveryLongitude,
      address: order.deliveryAddress,
    });

    return {
      orderId: order.id,
      waypoints,
      totalDistance: this.calculateRouteDistance(waypoints),
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
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

  /**
   * Calculate total route distance
   */
  private calculateRouteDistance(waypoints: any[]): number {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      totalDistance += this.calculateDistance(
        waypoints[i].latitude,
        waypoints[i].longitude,
        waypoints[i + 1].latitude,
        waypoints[i + 1].longitude,
      );
    }

    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Update rider location (for real-time tracking)
   */
  async updateRiderLocation(
    riderId: string,
    latitude: number,
    longitude: number,
    heading?: number,
    speed?: number,
  ) {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${riderId} not found`);
    }

    // Create new location record
    const location = this.riderLocationRepository.create({
      riderId,
      latitude,
      longitude,
      heading: heading || 0,
      speed: speed || 0,
    });

    await this.riderLocationRepository.save(location);

    this.logger.log(`Location updated for rider ${riderId}: (${latitude}, ${longitude})`);

    // Find active orders for this rider and broadcast updates via WebSocket
    const activeOrders = await this.orderRepository.find({
      where: {
        riderId,
        status: 'in_transit' as any, // or other active statuses
      },
    });

    // Broadcast location update to all clients tracking these orders
    if (this.trackingGateway && activeOrders.length > 0) {
      for (const order of activeOrders) {
        await this.trackingGateway.broadcastLocationUpdate(order.id, riderId);
      }
    }

    return {
      riderId,
      latitude,
      longitude,
      heading: location.heading,
      speed: location.speed,
      updatedAt: location.updatedAt,
    };
  }

  /**
   * Get rider location history
   */
  async getRiderLocationHistory(riderId: string, limit: number = 50) {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${riderId} not found`);
    }

    const locations = await this.riderLocationRepository.find({
      where: { riderId },
      order: { updatedAt: 'DESC' },
      take: limit,
    });

    return {
      riderId,
      riderName: rider.name,
      locations: locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        heading: loc.heading,
        speed: loc.speed,
        timestamp: loc.updatedAt,
      })),
      totalRecords: locations.length,
    };
  }

  /**
   * Get enhanced delivery route with Mapbox
   */
  async getEnhancedDeliveryRoute(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['merchant', 'rider'],
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

    const waypoints = [];

    // Add rider current location if available
    if (riderLocation) {
      waypoints.push({
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
        name: 'Current Location',
      });
    }

    // Add pickup location (merchant) if not yet picked up
    if (order.merchant && order.status !== 'delivered' && order.status !== 'in_transit') {
      waypoints.push({
        latitude: order.merchant.latitude,
        longitude: order.merchant.longitude,
        name: order.merchant.storeName,
      });
    }

    // Add delivery location
    waypoints.push({
      latitude: order.deliveryLatitude,
      longitude: order.deliveryLongitude,
      name: 'Delivery Location',
    });

    try {
      // Get optimized route from Mapbox
      const route = await this.mapboxService.getOptimizedRoute(waypoints, {
        profile: 'driving-traffic',
      });

      return {
        orderId: order.id,
        waypoints: route.waypoints,
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        estimatedArrival: new Date(Date.now() + route.totalDuration * 1000),
        geometry: route.geometry,
        legs: route.legs,
      };
    } catch (error) {
      this.logger.warn(`Failed to get enhanced route for order ${orderId}, using simple route`);
      // Fallback to simple waypoints
      return {
        orderId: order.id,
        waypoints,
        totalDistance: this.calculateRouteDistance(waypoints),
        totalDuration: null,
        estimatedArrival: null,
        geometry: null,
        legs: [],
      };
    }
  }

  /**
   * Get live tracking updates for multiple orders
   */
  async getActiveDeliveries(riderIds?: string[]) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    queryBuilder
      .where('order.status IN (:...statuses)', {
        statuses: ['assigned', 'picked_up', 'in_transit'],
      })
      .leftJoinAndSelect('order.rider', 'rider')
      .leftJoinAndSelect('order.merchant', 'merchant');

    if (riderIds && riderIds.length > 0) {
      queryBuilder.andWhere('order.riderId IN (:...riderIds)', { riderIds });
    }

    const orders = await queryBuilder.getMany();

    const deliveries = await Promise.all(
      orders.map(async (order) => {
        let riderLocation = null;
        let eta = null;

        if (order.riderId) {
          riderLocation = await this.riderLocationRepository.findOne({
            where: { riderId: order.riderId },
            order: { updatedAt: 'DESC' },
          });

          // Calculate ETA if rider location available
          if (riderLocation && order.deliveryLatitude && order.deliveryLongitude) {
            try {
              const result = await this.mapboxService.getDistanceAndDuration(
                { latitude: riderLocation.latitude, longitude: riderLocation.longitude },
                { latitude: order.deliveryLatitude, longitude: order.deliveryLongitude },
                'driving-traffic',
              );
              eta = Math.ceil(result.duration / 60); // minutes
            } catch (error) {
              this.logger.warn(`Failed to calculate ETA for order ${order.id}`);
            }
          }
        }

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          merchant: order.merchant
            ? {
                name: order.merchant.storeName,
                location: {
                  latitude: order.merchant.latitude,
                  longitude: order.merchant.longitude,
                },
              }
            : null,
          deliveryLocation: {
            latitude: order.deliveryLatitude,
            longitude: order.deliveryLongitude,
          },
          rider: order.rider
            ? {
                id: order.rider.id,
                name: order.rider.name,
                vehicleType: order.rider.vehicleType,
                currentLocation: riderLocation
                  ? {
                      latitude: riderLocation.latitude,
                      longitude: riderLocation.longitude,
                      speed: riderLocation.speed,
                      updatedAt: riderLocation.updatedAt,
                    }
                  : null,
              }
            : null,
          estimatedTimeMinutes: eta,
        };
      }),
    );

    return {
      activeDeliveries: deliveries,
      total: deliveries.length,
    };
  }
}
