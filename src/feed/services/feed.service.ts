import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Photo } from '../../domain/entities/photo.entity';
import { Follow } from '../../domain/entities/follow.entity';
import { FeedQueryDto } from '../dtos/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async getFeed(userId: string, query: FeedQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(Math.max(10, query.limit || 10), 100);
    const skip = (page - 1) * limit;

    // Get IDs of users being followed
    const following = await this.followRepository.find({
      where: { follower_id: userId },
      select: ['following_id'],
    });
    const followingIds = following.map((f) => f.following_id);

    // Include user's own photos in feed
    followingIds.push(userId);

    // Get photos with pagination
    const [photos, total] = await this.photoRepository.findAndCount({
      where: { user_id: In(followingIds) },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: photos,
      metadata: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
}
