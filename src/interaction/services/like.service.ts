import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../../domain/entities/like.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { CreateLikeDto } from '../dtos/create-like.dto';
import { LikeResponseDto } from '../dtos/like-response.dto';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  async create(userId: string, createLikeDto: CreateLikeDto): Promise<Like> {
    const photo = await this.photoRepository.findOne({
      where: { id: createLikeDto.photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: {
        user_id: userId,
        photo_id: createLikeDto.photoId,
      },
    });

    if (existingLike) {
      throw new ConflictException('User has already liked this photo');
    }

    const like = this.likeRepository.create({
      user_id: userId,
      photo_id: createLikeDto.photoId,
    });

    return this.likeRepository.save(like);
  }

  async remove(userId: string, photoId: string): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: {
        user_id: userId,
        photo_id: photoId,
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.likeRepository.remove(like);
  }

  async findByPhotoId(photoId: string): Promise<LikeResponseDto[]> {
    const likes = await this.likeRepository.find({
      where: { photo_id: photoId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return likes.map((like) => ({
      id: like.id,
      userId: like.user_id,
      photoId: like.photo_id,
      createdAt: like.created_at,
    }));
  }

  async getLikesCount(photoId: string): Promise<number> {
    return this.likeRepository.count({
      where: { photo_id: photoId },
    });
  }
}
