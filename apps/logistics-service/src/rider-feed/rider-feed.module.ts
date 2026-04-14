import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderFeedController } from './rider-feed.controller';
import { RiderFeedService } from './rider-feed.service';
import { RiderFeedVideo } from '../../../../libs/database/src/entities/rider-feed-video.entity';
import { RiderFeedLike } from '../../../../libs/database/src/entities/rider-feed-like.entity';
import { RiderFeedComment } from '../../../../libs/database/src/entities/rider-feed-comment.entity';
import { Rider } from '../../../../libs/database/src/entities/rider.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiderFeedVideo,
      RiderFeedLike,
      RiderFeedComment,
      Rider,
    ]),
  ],
  controllers: [RiderFeedController],
  providers: [RiderFeedService],
  exports: [RiderFeedService],
})
export class RiderFeedModule {}
