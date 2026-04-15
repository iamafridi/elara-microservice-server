import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiderFeedVideo, VideoPrivacy } from '../../../../libs/database/src/entities/rider-feed-video.entity';
import { RiderFeedLike } from '../../../../libs/database/src/entities/rider-feed-like.entity';
import { RiderFeedComment } from '../../../../libs/database/src/entities/rider-feed-comment.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';
import { CreateFeedVideoDto, UpdateFeedVideoDto } from './dto/create-feed-video.dto';

@Injectable()
export class RiderFeedService {
  private readonly logger = new Logger(RiderFeedService.name);

  constructor(
    @InjectRepository(RiderFeedVideo)
    private feedVideoRepository: Repository<RiderFeedVideo>,
    @InjectRepository(RiderFeedLike)
    private feedLikeRepository: Repository<RiderFeedLike>,
    @InjectRepository(RiderFeedComment)
    private feedCommentRepository: Repository<RiderFeedComment>,
    @InjectRepository(Rider)
    private riderRepository: Repository<Rider>,
  ) {}

  /**
   * Create a feed video post
   */
  async createFeedVideo(dto: CreateFeedVideoDto) {
    // Verify rider exists
    const rider = await this.riderRepository.findOne({
      where: { id: dto.riderId },
    });

    if (!rider) {
      throw new NotFoundException(`Rider ${dto.riderId} not found`);
    }

    // Create feed video
    const feedVideo = this.feedVideoRepository.create({
      riderId: dto.riderId,
      videoUrl: dto.videoUrl,
      thumbnailUrl: dto.thumbnailUrl,
      caption: dto.caption || '',
      hashtags: dto.hashtags || [],
      music: dto.music,
      privacy: dto.privacy || VideoPrivacy.PUBLIC,
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
    });

    await this.feedVideoRepository.save(feedVideo);

    this.logger.log(`Feed video ${feedVideo.id} created by rider ${dto.riderId}`);

    return this.findOne(feedVideo.id);
  }

  /**
   * Get feed video by ID
   */
  async findOne(id: string) {
    const video = await this.feedVideoRepository.findOne({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Feed video ${id} not found`);
    }

    // Fetch rider separately
    const rider = await this.riderRepository.findOne({
      where: { id: video.riderId },
    });

    return {
      id: video.id,
      rider: rider ? {
        id: rider.id,
        name: rider.name,
        profilePicture: rider.profilePicture,
        vehicleType: rider.vehicleType,
      } : null,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      caption: video.caption,
      hashtags: video.hashtags,
      music: video.music,
      privacy: video.privacy,
      viewsCount: video.viewsCount,
      likesCount: video.likesCount,
      commentsCount: video.commentsCount,
      createdAt: video.createdAt,
    };
  }

  /**
   * Get feed videos (For You page)
   */
  async getFeedVideos(userId?: string, limit: number = 20, offset: number = 0) {
    const videos = await this.feedVideoRepository.find({
      where: { privacy: VideoPrivacy.PUBLIC },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    // Fetch riders for all videos
    const riderIds = [...new Set(videos.map(v => v.riderId))];
    const riders = await this.riderRepository.find({
      where: riderIds.map(id => ({ id })),
    });
    const riderMap = new Map(riders.map(r => [r.id, r]));

    return {
      videos: videos.map(video => {
        const rider = riderMap.get(video.riderId);
        return {
          id: video.id,
          rider: rider ? {
            id: rider.id,
            name: rider.name,
            profilePicture: rider.profilePicture,
          } : null,
          videoUrl: video.videoUrl,
          thumbnailUrl: video.thumbnailUrl,
          caption: video.caption,
          hashtags: video.hashtags,
          music: video.music,
          viewsCount: video.viewsCount,
          likesCount: video.likesCount,
          commentsCount: video.commentsCount,
          createdAt: video.createdAt,
        };
      }),
      total: videos.length,
      hasMore: videos.length === limit,
    };
  }

  /**
   * Get rider's feed videos
   */
  async getRiderVideos(riderId: string, limit: number = 20, offset: number = 0) {
    const videos = await this.feedVideoRepository.find({
      where: { riderId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      videos: videos.map(video => ({
        id: video.id,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        caption: video.caption,
        hashtags: video.hashtags,
        music: video.music,
        privacy: video.privacy,
        viewsCount: video.viewsCount,
        likesCount: video.likesCount,
        commentsCount: video.commentsCount,
        createdAt: video.createdAt,
      })),
      total: videos.length,
      hasMore: videos.length === limit,
    };
  }

  /**
   * Update feed video
   */
  async updateFeedVideo(id: string, riderId: string, dto: UpdateFeedVideoDto) {
    const video = await this.feedVideoRepository.findOne({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Feed video ${id} not found`);
    }

    // Verify ownership
    if (video.riderId !== riderId) {
      throw new BadRequestException('You can only update your own videos');
    }

    // Update fields
    if (dto.caption !== undefined) video.caption = dto.caption;
    if (dto.hashtags) video.hashtags = dto.hashtags;
    if (dto.privacy) video.privacy = dto.privacy;

    await this.feedVideoRepository.save(video);

    this.logger.log(`Feed video ${id} updated by rider ${riderId}`);

    return this.findOne(id);
  }

  /**
   * Delete feed video
   */
  async deleteFeedVideo(id: string, riderId: string) {
    const video = await this.feedVideoRepository.findOne({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Feed video ${id} not found`);
    }

    // Verify ownership
    if (video.riderId !== riderId) {
      throw new BadRequestException('You can only delete your own videos');
    }

    await this.feedVideoRepository.remove(video);

    this.logger.log(`Feed video ${id} deleted by rider ${riderId}`);

    return { success: true, message: 'Video deleted successfully' };
  }

  /**
   * Like a video
   */
  async likeVideo(videoId: string, riderId: string) {
    const video = await this.feedVideoRepository.findOne({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException(`Feed video ${videoId} not found`);
    }

    // Check if already liked
    const existingLike = await this.feedLikeRepository.findOne({
      where: { videoId, riderId },
    });

    if (existingLike) {
      throw new BadRequestException('You have already liked this video');
    }

    // Create like
    const like = this.feedLikeRepository.create({
      videoId,
      riderId,
    });

    await this.feedLikeRepository.save(like);

    // Update like count
    video.likesCount += 1;
    await this.feedVideoRepository.save(video);

    this.logger.log(`Video ${videoId} liked by rider ${riderId}`);

    return { success: true, likesCount: video.likesCount };
  }

  /**
   * Unlike a video
   */
  async unlikeVideo(videoId: string, riderId: string) {
    const like = await this.feedLikeRepository.findOne({
      where: { videoId, riderId },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.feedLikeRepository.remove(like);

    // Update like count
    const video = await this.feedVideoRepository.findOne({
      where: { id: videoId },
    });

    if (video && video.likesCount > 0) {
      video.likesCount -= 1;
      await this.feedVideoRepository.save(video);
    }

    this.logger.log(`Video ${videoId} unliked by rider ${riderId}`);

    return { success: true, likesCount: video?.likesCount || 0 };
  }

  /**
   * Add comment to video
   */
  async addComment(videoId: string, riderId: string, commentText: string) {
    const video = await this.feedVideoRepository.findOne({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException(`Feed video ${videoId} not found`);
    }

    // Create comment
    const comment = this.feedCommentRepository.create({
      videoId,
      riderId,
      commentText,
    });

    await this.feedCommentRepository.save(comment);

    // Update comment count
    video.commentsCount += 1;
    await this.feedVideoRepository.save(video);

    this.logger.log(`Comment added to video ${videoId} by rider ${riderId}`);

    return {
      id: comment.id,
      commentText: comment.commentText,
      riderId: comment.riderId,
      createdAt: comment.createdAt,
    };
  }

  /**
   * Get video comments
   */
  async getComments(videoId: string, limit: number = 50, offset: number = 0) {
    const comments = await this.feedCommentRepository.find({
      where: { videoId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    // Fetch riders for all comments
    const riderIds = [...new Set(comments.map(c => c.riderId))];
    const riders = await this.riderRepository.find({
      where: riderIds.map(id => ({ id })),
    });
    const riderMap = new Map(riders.map(r => [r.id, r]));

    return {
      comments: comments.map(comment => {
        const rider = riderMap.get(comment.riderId);
        return {
          id: comment.id,
          commentText: comment.commentText,
          rider: rider ? {
            id: rider.id,
            name: rider.name,
            profilePicture: rider.profilePicture,
          } : null,
          createdAt: comment.createdAt,
        };
      }),
      total: comments.length,
      hasMore: comments.length === limit,
    };
  }

  /**
   * Increment view count
   */
  async incrementViewCount(videoId: string) {
    await this.feedVideoRepository.increment({ id: videoId }, 'viewsCount', 1);
    return { success: true };
  }

  /**
   * Search videos by hashtag
   */
  async searchByHashtag(hashtag: string, limit: number = 20, offset: number = 0) {
    const queryBuilder = this.feedVideoRepository.createQueryBuilder('video');

    queryBuilder
      .where(':hashtag = ANY(video.hashtags)', { hashtag: hashtag.toLowerCase() })
      .andWhere('video.privacy = :privacy', { privacy: VideoPrivacy.PUBLIC })
      .orderBy('video.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const videos = await queryBuilder.getMany();

    // Fetch riders for all videos
    const riderIds = [...new Set(videos.map(v => v.riderId))];
    const riders = await this.riderRepository.find({
      where: riderIds.map(id => ({ id })),
    });
    const riderMap = new Map(riders.map(r => [r.id, r]));

    return videos.map(video => {
      const rider = riderMap.get(video.riderId);
      return {
        id: video.id,
        rider: rider ? {
          id: rider.id,
          name: rider.name,
          profilePicture: rider.profilePicture,
        } : null,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        caption: video.caption,
        hashtags: video.hashtags,
        music: video.music,
        viewsCount: video.viewsCount,
        likesCount: video.likesCount,
        commentsCount: video.commentsCount,
        createdAt: video.createdAt,
      };
    });
  }
}
