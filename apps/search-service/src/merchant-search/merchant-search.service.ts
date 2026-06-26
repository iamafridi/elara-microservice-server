import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Merchant, MerchantStatus, OpenStatus } from '../../../../libs/database/src/entities/merchant.entity';

export interface MerchantSearchParams {
  query?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  openNow?: boolean;
  minRating?: number;
  sortBy?: 'rating' | 'distance' | 'name';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

@Injectable()
export class MerchantSearchService {
  private readonly logger = new Logger(MerchantSearchService.name);

  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Search merchants with filters
   */
  async searchMerchants(params: MerchantSearchParams) {
    const {
      query,
      categoryId,
      latitude,
      longitude,
      radiusKm = 10,
      openNow,
      minRating,
      sortBy = 'rating',
      sortOrder = 'DESC',
      limit = 20,
      offset = 0,
    } = params;

    const queryBuilder = this.merchantRepository.createQueryBuilder('merchant');

    // Base filters
    queryBuilder
      .where('merchant.status = :status', { status: MerchantStatus.ACTIVE })
      .leftJoinAndSelect('merchant.category', 'category');

    // Text search
    if (query) {
      queryBuilder.andWhere(
        '(merchant.storeName ILIKE :query OR merchant.description ILIKE :query OR merchant.city ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Category filter
    if (categoryId) {
      queryBuilder.andWhere('merchant.categoryId = :categoryId', { categoryId });
    }

    // Open now filter
    if (openNow) {
      queryBuilder.andWhere('merchant.openStatus = :openStatus', { openStatus: OpenStatus.OPEN });
    }

    // Rating filter
    if (minRating !== undefined) {
      queryBuilder.andWhere('merchant.rating >= :minRating', { minRating });
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        queryBuilder.orderBy('merchant.rating', sortOrder);
        queryBuilder.addOrderBy('merchant.totalOrders', 'DESC');
        break;
      case 'name':
        queryBuilder.orderBy('merchant.storeName', sortOrder);
        break;
      default:
        queryBuilder.orderBy('merchant.rating', sortOrder);
    }

    // Pagination
    queryBuilder.skip(offset).take(limit);

    const [merchants, total] = await queryBuilder.getManyAndCount();

    // Calculate distance if coordinates provided
    const results = merchants.map(merchant => {
      let distance = null;
      if (latitude !== undefined && longitude !== undefined) {
        distance = this.calculateDistance(
          latitude,
          longitude,
          merchant.latitude,
          merchant.longitude,
        );
      }

      return {
        id: merchant.id,
        name: merchant.storeName,
        slug: merchant.slug,
        logo: merchant.logo,
        coverImage: merchant.coverImage,
        description: merchant.description,
        address: merchant.address,
        city: merchant.city,
        location: {
          latitude: merchant.latitude,
          longitude: merchant.longitude,
        },
        rating: merchant.rating,
        totalReviews: merchant.totalReviews,
        totalOrders: merchant.totalOrders,
        openStatus: merchant.openStatus,
        prepTimeMinutes: merchant.prepTimeMinutes,
        deliveryRadiusKm: merchant.deliveryRadiusKm,
        category: merchant.category ? {
          id: merchant.category.id,
          name: merchant.category.name,
        } : null,
        distance: distance ? Math.round(distance * 10) / 10 : null,
      };
    });

    // Filter by distance if coordinates provided
    let filteredResults = results;
    if (latitude !== undefined && longitude !== undefined) {
      filteredResults = results.filter(m => m.distance !== null && m.distance <= radiusKm);

      // Sort by distance if requested
      if (sortBy === 'distance') {
        filteredResults.sort((a, b) => {
          const distA = a.distance || 999999;
          const distB = b.distance || 999999;
          return sortOrder === 'ASC' ? distA - distB : distB - distA;
        });
      }
    }

    return {
      data: filteredResults,
      total: filteredResults.length,
      limit,
      offset,
      hasMore: offset + filteredResults.length < total,
    };
  }

  /**
   * Get merchant autocomplete suggestions
   */
  async autocomplete(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return [];
    }

    const merchants = await this.merchantRepository.find({
      where: [
        { storeName: ILike(`%${query}%`), status: MerchantStatus.ACTIVE },
      ],
      select: ['id', 'storeName', 'logo', 'city'],
      take: limit,
      order: { rating: 'DESC' },
    });

    return merchants.map(merchant => ({
      id: merchant.id,
      name: merchant.storeName,
      logo: merchant.logo,
      city: merchant.city,
    }));
  }

  /**
   * Get top-rated merchants
   */
  async getTopRated(limit: number = 10) {
    const merchants = await this.merchantRepository.find({
      where: { status: MerchantStatus.ACTIVE },
      relations: ['category'],
      order: { rating: 'DESC', totalReviews: 'DESC' },
      take: limit,
    });

    return merchants.map(merchant => ({
      id: merchant.id,
      name: merchant.storeName,
      logo: merchant.logo,
      rating: merchant.rating,
      totalReviews: merchant.totalReviews,
      category: merchant.category ? {
        id: merchant.category.id,
        name: merchant.category.name,
      } : null,
    }));
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
