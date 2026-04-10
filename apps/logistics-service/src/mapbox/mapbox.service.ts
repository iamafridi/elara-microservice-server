import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');
const mbxMatrix = require('@mapbox/mapbox-sdk/services/matrix');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteWaypoint extends Coordinate {
  name?: string;
  orderId?: string;
}

export interface OptimizedRoute {
  waypoints: RouteWaypoint[];
  totalDistance: number; // meters
  totalDuration: number; // seconds
  geometry: any;
  legs: RouteLeg[];
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: RouteStep[];
  summary: string;
}

export interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  maneuver: {
    type: string;
    instruction: string;
    location: [number, number];
  };
}

export interface DistanceMatrixResult {
  origins: Coordinate[];
  destinations: Coordinate[];
  distances: number[][]; // meters
  durations: number[][]; // seconds
}

@Injectable()
export class MapboxService {
  private readonly logger = new Logger(MapboxService.name);
  private readonly accessToken: string;
  private directionsClient: any;
  private matrixClient: any;
  private geocodingClient: any;

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN');

    if (!this.accessToken || this.accessToken.includes('your_mapbox_token')) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN not configured or is placeholder. Mapbox features will be limited.');
    } else {
      try {
        this.directionsClient = mbxDirections({ accessToken: this.accessToken });
        this.matrixClient = mbxMatrix({ accessToken: this.accessToken });
        this.geocodingClient = mbxGeocoding({ accessToken: this.accessToken });
        this.logger.log('Mapbox services initialized');
      } catch (err: any) {
        this.logger.warn('Failed to initialize Mapbox client: ' + err.message);
      }
    }
  }

  /**
   * Get optimized route with turn-by-turn directions
   */
  async getOptimizedRoute(
    waypoints: RouteWaypoint[],
    options: {
      profile?: 'driving' | 'driving-traffic' | 'cycling' | 'walking';
      optimize?: boolean;
      roundtrip?: boolean;
    } = {},
  ): Promise<OptimizedRoute> {
    if (!this.directionsClient) {
      throw new BadRequestException('Mapbox not configured');
    }

    if (waypoints.length < 2) {
      throw new BadRequestException('At least 2 waypoints required');
    }

    if (waypoints.length > 25) {
      throw new BadRequestException('Maximum 25 waypoints allowed');
    }

    try {
      const coordinates = waypoints.map(w => [w.longitude, w.latitude]);

      const request = {
        waypoints: coordinates.map((coord, index) => ({
          coordinates: coord,
          ...(waypoints[index].name && { name: waypoints[index].name }),
        })),
        profile: options.profile || 'driving-traffic',
        geometries: 'geojson',
        overview: 'full',
        steps: true,
        ...(options.optimize && { optimize: 'true' }),
        ...(options.roundtrip !== undefined && { roundtrip: options.roundtrip }),
      };

      const response = await this.directionsClient.getDirections(request).send();

      if (!response.body || !response.body.routes || response.body.routes.length === 0) {
        throw new BadRequestException('No route found');
      }

      const route = response.body.routes[0];
      const waypointOrder = response.body.waypoints.map((wp: any) => wp.waypoint_index);

      // Reorder waypoints based on optimization
      const optimizedWaypoints = waypointOrder.map((index: number) => waypoints[index]);

      return {
        waypoints: optimizedWaypoints,
        totalDistance: route.distance,
        totalDuration: route.duration,
        geometry: route.geometry,
        legs: route.legs.map((leg: any) => ({
          distance: leg.distance,
          duration: leg.duration,
          summary: leg.summary,
          steps: leg.steps.map((step: any) => ({
            distance: step.distance,
            duration: step.duration,
            instruction: step.maneuver.instruction,
            maneuver: {
              type: step.maneuver.type,
              instruction: step.maneuver.instruction,
              location: step.maneuver.location,
            },
          })),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get optimized route', error.message);
      throw new BadRequestException(`Route optimization failed: ${error.message}`);
    }
  }

  /**
   * Calculate distance and duration matrix between multiple points
   */
  async getDistanceMatrix(
    origins: Coordinate[],
    destinations: Coordinate[],
    profile: 'driving' | 'driving-traffic' | 'cycling' | 'walking' = 'driving-traffic',
  ): Promise<DistanceMatrixResult> {
    if (!this.matrixClient) {
      throw new BadRequestException('Mapbox not configured');
    }

    if (origins.length > 25 || destinations.length > 25) {
      throw new BadRequestException('Maximum 25 origins/destinations allowed');
    }

    try {
      const allPoints = [...origins, ...destinations];
      const coordinates = allPoints.map(p => [p.longitude, p.latitude]);

      const sourceIndices = origins.map((_, index) => index);
      const destinationIndices = destinations.map((_, index) => origins.length + index);

      const request = {
        points: coordinates,
        profile,
        sources: sourceIndices,
        destinations: destinationIndices,
      };

      const response = await this.matrixClient.getMatrix(request).send();

      if (!response.body) {
        throw new BadRequestException('No matrix data returned');
      }

      return {
        origins,
        destinations,
        distances: response.body.distances || [],
        durations: response.body.durations || [],
      };
    } catch (error) {
      this.logger.error('Failed to calculate distance matrix', error.message);
      throw new BadRequestException(`Distance matrix calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate distance and duration between two points
   */
  async getDistanceAndDuration(
    origin: Coordinate,
    destination: Coordinate,
    profile: 'driving' | 'driving-traffic' | 'cycling' | 'walking' = 'driving-traffic',
  ): Promise<{ distance: number; duration: number }> {
    if (!this.directionsClient) {
      throw new BadRequestException('Mapbox not configured');
    }

    try {
      const request = {
        waypoints: [
          { coordinates: [origin.longitude, origin.latitude] },
          { coordinates: [destination.longitude, destination.latitude] },
        ],
        profile,
        geometries: 'geojson',
        overview: 'simplified',
      };

      const response = await this.directionsClient.getDirections(request).send();

      if (!response.body || !response.body.routes || response.body.routes.length === 0) {
        throw new BadRequestException('No route found');
      }

      const route = response.body.routes[0];

      return {
        distance: route.distance, // meters
        duration: route.duration, // seconds
      };
    } catch (error) {
      this.logger.error('Failed to calculate distance and duration', error.message);
      throw new BadRequestException(`Distance calculation failed: ${error.message}`);
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<Coordinate | null> {
    if (!this.geocodingClient) {
      throw new BadRequestException('Mapbox not configured');
    }

    try {
      const response = await this.geocodingClient
        .forwardGeocode({
          query: address,
          limit: 1,
          countries: ['GB'], // UK only
        })
        .send();

      if (!response.body || !response.body.features || response.body.features.length === 0) {
        return null;
      }

      const [longitude, latitude] = response.body.features[0].center;

      return { latitude, longitude };
    } catch (error) {
      this.logger.error('Failed to geocode address', error.message);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinate: Coordinate): Promise<string | null> {
    if (!this.geocodingClient) {
      throw new BadRequestException('Mapbox not configured');
    }

    try {
      const response = await this.geocodingClient
        .reverseGeocode({
          query: [coordinate.longitude, coordinate.latitude],
          limit: 1,
          types: ['address'],
        })
        .send();

      if (!response.body || !response.body.features || response.body.features.length === 0) {
        return null;
      }

      return response.body.features[0].place_name;
    } catch (error) {
      this.logger.error('Failed to reverse geocode', error.message);
      return null;
    }
  }

  /**
   * Calculate ETA (Estimated Time of Arrival)
   */
  async calculateETA(
    origin: Coordinate,
    destination: Coordinate,
    profile: 'driving' | 'driving-traffic' | 'cycling' | 'walking' = 'driving-traffic',
  ): Promise<Date> {
    const { duration } = await this.getDistanceAndDuration(origin, destination, profile);

    // Add buffer time for traffic and stops (10%)
    const bufferSeconds = duration * 0.1;
    const totalSeconds = duration + bufferSeconds;

    return new Date(Date.now() + totalSeconds * 1000);
  }

  /**
   * Find nearest location from a list
   */
  async findNearest(
    origin: Coordinate,
    locations: Coordinate[],
  ): Promise<{ index: number; coordinate: Coordinate; distance: number; duration: number }> {
    const matrix = await this.getDistanceMatrix([origin], locations);

    if (!matrix.durations || !matrix.durations[0]) {
      throw new BadRequestException('Failed to calculate distances');
    }

    let minIndex = 0;
    let minDuration = matrix.durations[0][0];

    for (let i = 1; i < matrix.durations[0].length; i++) {
      if (matrix.durations[0][i] < minDuration) {
        minDuration = matrix.durations[0][i];
        minIndex = i;
      }
    }

    return {
      index: minIndex,
      coordinate: locations[minIndex],
      distance: matrix.distances[0][minIndex],
      duration: matrix.durations[0][minIndex],
    };
  }

  /**
   * Check if Mapbox is configured
   */
  isConfigured(): boolean {
    return !!this.accessToken;
  }
}
