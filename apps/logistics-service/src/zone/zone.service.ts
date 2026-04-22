import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from '../../../../libs/database/src/entities/zone.entity';
import { ZoneModule } from '../../../../libs/database/src/entities/zone-module.entity';
import { RiderZone } from '../../../../libs/database/src/entities/rider-zone.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import {
  CreateZoneDto,
  UpdateZoneDto,
  ConfigureZoneModuleDto,
  AssignRiderToZoneDto,
  CheckLocationDto,
} from './dto/create-zone.dto';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger(ZoneService.name);

  constructor(
    @InjectRepository(Zone)
    private zoneRepository: Repository<Zone>,
    @InjectRepository(ZoneModule)
    private zoneModuleRepository: Repository<ZoneModule>,
    @InjectRepository(RiderZone)
    private riderZoneRepository: Repository<RiderZone>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
  ) {}

  /**
   * Create a new delivery zone
   */
  async createZone(dto: CreateZoneDto) {
    // Convert GeoJSON to PostGIS format
    const polygonWKT = this.geoJsonToWKT(dto.polygon);

    const zone = this.zoneRepository.create({
      name: dto.name,
      polygon: polygonWKT as any,
      status: 'ACTIVE' as any,
      metadata: dto.metadata || {},
    });

    await this.zoneRepository.save(zone);
    this.logger.log(`Zone created: ${zone.id} - ${zone.name}`);

    return zone;
  }

  /**
   * Get all zones
   */
  async getAllZones(status?: 'active' | 'inactive') {
    const queryBuilder = this.zoneRepository.createQueryBuilder('zone')
      .leftJoinAndSelect('zone.modules', 'modules');

    if (status) {
      queryBuilder.where('zone.status = :status', { status: status.toUpperCase() });
    }

    const zones = await queryBuilder.getMany();

    return zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      status: zone.status,
      metadata: zone.metadata,
      modules: zone.modules,
      createdAt: zone.createdAt,
    }));
  }

  /**
   * Get zone by ID
   */
  async findOne(id: string) {
    const zone = await this.zoneRepository.findOne({
      where: { id },
      relations: ['modules'],
    });

    if (!zone) {
      throw new NotFoundException(`Zone ${id} not found`);
    }

    return zone;
  }

  /**
   * Update zone
   */
  async updateZone(id: string, dto: UpdateZoneDto) {
    const zone = await this.findOne(id);

    if (dto.name) zone.name = dto.name;
    if (dto.status) zone.status = dto.status.toUpperCase() as any;
    if (dto.metadata) zone.metadata = dto.metadata;

    if (dto.polygon) {
      const polygonWKT = this.geoJsonToWKT(dto.polygon);
      zone.polygon = polygonWKT as any;
    }

    await this.zoneRepository.save(zone);
    this.logger.log(`Zone updated: ${id}`);

    return zone;
  }

  /**
   * Delete zone
   */
  async deleteZone(id: string) {
    const zone = await this.findOne(id);

    await this.zoneRepository.remove(zone);
    this.logger.log(`Zone deleted: ${id}`);

    return { deleted: true };
  }

  /**
   * Configure zone module (delivery fees, commission)
   */
  async configureZoneModule(dto: ConfigureZoneModuleDto) {
    const zone = await this.findOne(dto.zoneId);

    let zoneModule = await this.zoneModuleRepository.findOne({
      where: {
        zoneId: dto.zoneId,
        moduleName: dto.moduleName as any,
      },
    });

    if (zoneModule) {
      // Update existing configuration
      zoneModule.deliveryFee = dto.deliveryFee;
      zoneModule.commissionPercent = dto.commissionPercent;
      if (dto.isActive !== undefined) {
        zoneModule.isActive = dto.isActive;
      }
    } else {
      // Create new configuration
      zoneModule = this.zoneModuleRepository.create({
        zoneId: dto.zoneId,
        moduleName: dto.moduleName as any,
        deliveryFee: dto.deliveryFee,
        commissionPercent: dto.commissionPercent,
        isActive: dto.isActive ?? true,
      });
    }

    await this.zoneModuleRepository.save(zoneModule);
    this.logger.log(`Zone module configured: ${dto.zoneId} - ${dto.moduleName}`);

    return zoneModule;
  }

  /**
   * Assign rider to zone
   */
  async assignRiderToZone(dto: AssignRiderToZoneDto) {
    const zone = await this.findOne(dto.zoneId);
    const rider = await this.riderRepository.findOne({
      where: { id: dto.riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${dto.riderId} not found`);
    }

    // Check if already assigned
    let riderZone = await this.riderZoneRepository.findOne({
      where: {
        riderId: dto.riderId,
        zoneId: dto.zoneId,
      },
    });

    if (riderZone) {
      // Reactivate if inactive
      if (!riderZone.isActive) {
        riderZone.isActive = true;
        await this.riderZoneRepository.save(riderZone);
      }
      return riderZone;
    }

    // Create new assignment
    riderZone = this.riderZoneRepository.create({
      riderId: dto.riderId,
      zoneId: dto.zoneId,
      isActive: true,
    });

    await this.riderZoneRepository.save(riderZone);
    this.logger.log(`Rider ${dto.riderId} assigned to zone ${dto.zoneId}`);

    return riderZone;
  }

  /**
   * Remove rider from zone
   */
  async removeRiderFromZone(riderId: string, zoneId: string) {
    const riderZone = await this.riderZoneRepository.findOne({
      where: { riderId, zoneId },
    });

    if (!riderZone) {
      throw new NotFoundException('Rider zone assignment not found');
    }

    riderZone.isActive = false;
    await this.riderZoneRepository.save(riderZone);

    this.logger.log(`Rider ${riderId} removed from zone ${zoneId}`);

    return { success: true };
  }

  /**
   * Get riders in a zone
   */
  async getRidersInZone(zoneId: string) {
    const zone = await this.findOne(zoneId);

    const riderZones = await this.riderZoneRepository.find({
      where: { zoneId, isActive: true },
    });

    // Fetch riders separately
    const riderIds = riderZones.map(rz => rz.riderId);
    const riders = riderIds.length > 0
      ? await this.riderRepository.find({ where: riderIds.map(id => ({ id })) })
      : [];
    const riderMap = new Map(riders.map(r => [r.id, r]));

    return riderZones.map(rz => ({
      riderId: rz.riderId,
      riderName: riderMap.get(rz.riderId)?.name,
      assignedAt: rz.createdAt,
    }));
  }

  /**
   * Get zones for a rider
   */
  async getRiderZones(riderId: string) {
    const rider = await this.riderRepository.findOne({
      where: { id: riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${riderId} not found`);
    }

    const riderZones = await this.riderZoneRepository.find({
      where: { riderId, isActive: true },
    });

    // Fetch zones and their modules
    const zoneIds = riderZones.map(rz => rz.zoneId);
    const zones = zoneIds.length > 0
      ? await this.zoneRepository.find({
          where: zoneIds.map(id => ({ id })),
          relations: ['modules'],
        })
      : [];
    const zoneMap = new Map(zones.map(z => [z.id, z]));

    return riderZones.map(rz => {
      const zone = zoneMap.get(rz.zoneId);
      return {
        zoneId: rz.zoneId,
        zoneName: zone?.name,
        zoneStatus: zone?.status,
        modules: zone?.modules,
      };
    });
  }

  /**
   * Check if location is within a zone
   */
  async checkLocation(dto: CheckLocationDto) {
    const queryBuilder = this.zoneRepository
      .createQueryBuilder('zone')
      .leftJoinAndSelect('zone.modules', 'modules')
      .where(`ST_Contains(zone.polygon, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))`, {
        lng: dto.longitude,
        lat: dto.latitude,
      })
      .andWhere('zone.status = :status', { status: 'ACTIVE' });

    if (dto.moduleType) {
      queryBuilder
        .andWhere('modules.moduleName = :moduleType', { moduleType: dto.moduleType })
        .andWhere('modules.isActive = :moduleActive', { moduleActive: true });
    }

    const zones = await queryBuilder.getMany();

    return {
      latitude: dto.latitude,
      longitude: dto.longitude,
      inZone: zones.length > 0,
      zones: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        modules: zone.modules?.filter(m =>
          !dto.moduleType || m.moduleName === dto.moduleType
        ),
      })),
    };
  }

  /**
   * Get delivery fee for location
   */
  async getDeliveryFee(latitude: number, longitude: number, moduleType: string) {
    const locationCheck = await this.checkLocation({
      latitude,
      longitude,
      moduleType,
    });

    if (!locationCheck.inZone || locationCheck.zones.length === 0) {
      throw new BadRequestException('Location is not within any delivery zone');
    }

    // Get the first zone's delivery fee for the module
    const zone = locationCheck.zones[0];
    const module = zone.modules?.find(m => m.moduleName === moduleType);

    if (!module) {
      throw new BadRequestException('Module not available in this zone');
    }

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      deliveryFee: module.deliveryFee,
      commissionPercent: module.commissionPercent,
    };
  }

  /**
   * Convert GeoJSON to WKT format for PostGIS
   */
  private geoJsonToWKT(geoJson: any): string {
    if (geoJson.type === 'Polygon') {
      const coordinates = geoJson.coordinates[0];
      const points = coordinates
        .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
        .join(', ');
      return `POLYGON((${points}))`;
    }
    throw new BadRequestException('Invalid GeoJSON format. Only Polygon type is supported.');
  }
}
