import { Injectable, Logger, NotFoundException, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../../libs/database/src/entities/order.entity';
import { Rider, OnlineStatus, RiderStatus } from '../../../../libs/database/src/entities/rider.entity';
import { RiderLocation } from '../../../../libs/database/src/entities/rider-location.entity';
import { MapboxService, RouteWaypoint } from '../mapbox/mapbox.service';

interface Location {
  latitude: number;
  longitude: number;
}

interface DeliveryPoint extends Location {
  orderId: string;
  address: string;
  priority: number;
}

@Injectable()
export class RouteService {
  private readonly logger = new Logger(RouteService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
    @InjectRepository(RiderLocation)
    private riderLocationRepository: Repository<RiderLocation>,
    @Optional() private mapboxService?: MapboxService,
  ) {
    if (this.mapboxService?.isConfigured()) {
      this.logger.log('Mapbox integration enabled for advanced routing');
    } else {
      this.logger.warn('Mapbox not configured, using basic routing algorithms');
    }
  }

  /**
   * Optimize route for multiple deliveries
   * Uses Mapbox when available, falls back to Nearest Neighbor algorithm
   */
  async optimizeRoute(riderId: string) {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${riderId} not found`);
    }

    // Get all assigned deliveries for this rider
    const orders = await this.orderRepository.find({
      where: {
        riderId,
        status: ['assigned', 'picked_up', 'in_transit'] as any,
      },
      order: { createdAt: 'ASC' },
    });

    if (orders.length === 0) {
      return {
        riderId,
        deliveries: [],
        totalDistance: 0,
        estimatedTimeMinutes: 0,
      };
    }

    // Get rider current location
    const riderLocation = await this.riderLocationRepository.findOne({
      where: { riderId },
      order: { updatedAt: 'DESC' },
    });

    const startLocation: Location = riderLocation
      ? { latitude: riderLocation.latitude, longitude: riderLocation.longitude }
      : { latitude: orders[0].deliveryLatitude, longitude: orders[0].deliveryLongitude };

    // Try Mapbox optimization first
    if (this.mapboxService?.isConfigured() && orders.length <= 12) {
      try {
        return await this.optimizeRouteWithMapbox(riderId, startLocation, orders);
      } catch (error) {
        this.logger.warn(`Mapbox optimization failed, falling back to basic algorithm: ${error.message}`);
      }
    }

    // Fallback to basic nearest neighbor algorithm
    return await this.optimizeRouteBasic(riderId, startLocation, orders);
  }

  /**
   * Optimize route using Mapbox Directions API
   */
  private async optimizeRouteWithMapbox(riderId: string, startLocation: Location, orders: any[]) {
    const waypoints: RouteWaypoint[] = [
      {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        name: 'Current Location',
      },
      ...orders.map(order => ({
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
        name: order.deliveryAddress,
        orderId: order.id,
      })),
    ];

    const result = await this.mapboxService.getOptimizedRoute(waypoints, {
      profile: 'driving-traffic',
      optimize: true,
      roundtrip: false,
    });

    // Remove the starting point from deliveries
    const deliveryWaypoints = result.waypoints.slice(1);

    return {
      riderId,
      deliveries: deliveryWaypoints.map((point, index) => ({
        sequence: index + 1,
        orderId: point.orderId,
        address: point.name,
        location: {
          latitude: point.latitude,
          longitude: point.longitude,
        },
      })),
      totalDistance: Math.round(result.totalDistance / 1000 * 100) / 100, // Convert to km
      estimatedTimeMinutes: Math.ceil(result.totalDuration / 60),
      mapboxOptimized: true,
      geometry: result.geometry,
    };
  }

  /**
   * Optimize route using basic nearest neighbor algorithm
   */
  private async optimizeRouteBasic(riderId: string, startLocation: Location, orders: any[]) {
    // Create delivery points
    const deliveryPoints: DeliveryPoint[] = orders.map(order => ({
      orderId: order.id,
      latitude: order.deliveryLatitude,
      longitude: order.deliveryLongitude,
      address: order.deliveryAddress,
      priority: 0,
    }));

    // Optimize using nearest neighbor algorithm
    const optimizedRoute = this.nearestNeighborRoute(startLocation, deliveryPoints);

    // Calculate total distance
    let totalDistance = 0;
    let currentLocation = startLocation;

    for (const point of optimizedRoute) {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        point.latitude,
        point.longitude,
      );
      totalDistance += distance;
      currentLocation = point;
    }

    // Estimate time (assuming 30 km/h average speed + 5 min per stop)
    const estimatedTimeMinutes = Math.ceil((totalDistance / 30) * 60) + (optimizedRoute.length * 5);

    return {
      riderId,
      deliveries: optimizedRoute.map((point, index) => ({
        sequence: index + 1,
        orderId: point.orderId,
        address: point.address,
        location: {
          latitude: point.latitude,
          longitude: point.longitude,
        },
      })),
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedTimeMinutes,
      mapboxOptimized: false,
    };
  }

  /**
   * Calculate estimated delivery time for an order
   */
  async calculateDeliveryTime(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['merchant'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    let estimatedMinutes = 30; // Default 30 minutes

    if (order.riderId) {
      const riderLocation = await this.riderLocationRepository.findOne({
        where: { riderId: order.riderId },
        order: { updatedAt: 'DESC' },
      });

      if (riderLocation) {
        // Calculate distance from rider to delivery
        const distance = this.calculateDistance(
          riderLocation.latitude,
          riderLocation.longitude,
          order.deliveryLatitude,
          order.deliveryLongitude,
        );

        // Estimate time based on distance (30 km/h average)
        estimatedMinutes = Math.ceil((distance / 30) * 60);
      }
    } else if (order.merchant) {
      // Calculate distance from merchant to delivery
      const distance = this.calculateDistance(
        order.merchant.latitude,
        order.merchant.longitude,
        order.deliveryLatitude,
        order.deliveryLongitude,
      );

      // Add preparation time + delivery time
      const preparationTime = 15;
      const deliveryTime = Math.ceil((distance / 30) * 60);
      estimatedMinutes = preparationTime + deliveryTime;
    }

    return {
      orderId: order.id,
      estimatedDeliveryMinutes: estimatedMinutes,
      estimatedDeliveryTime: new Date(Date.now() + estimatedMinutes * 60 * 1000),
    };
  }

  /**
   * Find nearest available rider to a location
   */
  async findNearestRider(latitude: number, longitude: number, zoneId?: string) {
    const queryBuilder = this.riderRepository.createQueryBuilder('rider');

    queryBuilder
      .where('rider.onlineStatus = :onlineStatus', { onlineStatus: OnlineStatus.ONLINE })
      .andWhere('rider.status = :status', { status: RiderStatus.ACTIVE });

    const riders = await queryBuilder.getMany();

    if (riders.length === 0) {
      return null;
    }

    // Get locations for all riders and calculate distances
    const ridersWithDistance = await Promise.all(
      riders.map(async (rider) => {
        const location = await this.riderLocationRepository.findOne({
          where: { riderId: rider.id },
          order: { updatedAt: 'DESC' },
        });

        if (!location) {
          return null;
        }

        const distance = this.calculateDistance(
          latitude,
          longitude,
          location.latitude,
          location.longitude,
        );

        return {
          rider,
          location,
          distance,
        };
      }),
    );

    // Filter out riders without location and sort by distance
    const validRiders = ridersWithDistance
      .filter(r => r !== null)
      .sort((a, b) => a.distance - b.distance);

    if (validRiders.length === 0) {
      return null;
    }

    const nearest = validRiders[0];

    return {
      riderId: nearest.rider.id,
      riderName: nearest.rider.name,
      riderPhone: nearest.rider.phone,
      vehicleType: nearest.rider.vehicleType,
      currentLocation: {
        latitude: nearest.location.latitude,
        longitude: nearest.location.longitude,
      },
      distanceKm: Math.round(nearest.distance * 100) / 100,
      estimatedArrivalMinutes: Math.ceil((nearest.distance / 30) * 60),
    };
  }

  /**
   * Nearest Neighbor algorithm for route optimization
   */
  private nearestNeighborRoute(start: Location, points: DeliveryPoint[]): DeliveryPoint[] {
    const route: DeliveryPoint[] = [];
    const remaining = [...points];
    let current = start;

    // Prioritize high-priority deliveries first
    remaining.sort((a, b) => b.priority - a.priority);

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        current.latitude,
        current.longitude,
        remaining[0].latitude,
        remaining[0].longitude,
      );

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          current.latitude,
          current.longitude,
          remaining[i].latitude,
          remaining[i].longitude,
        );

        // Prefer closer points, but boost priority items
        const effectiveDistance = remaining[i].priority > 0 ? distance * 0.8 : distance;

        if (effectiveDistance < nearestDistance) {
          nearestDistance = effectiveDistance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      route.push(nearest);
      current = nearest;
    }

    return route;
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
}
