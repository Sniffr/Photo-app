import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../domain/entities/comment.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { CommentResponseDto } from '../dtos/comment-response.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  async create(
    userId: string,
    photoId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const comment = this.commentRepository.create({
      user_id: userId,
      photo_id: photoId,
      content: createCommentDto.content,
    });

    return this.commentRepository.save(comment);
  }

  async findByPhotoId(photoId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { photo_id: photoId },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      userId: comment.user_id,
      photoId: comment.photo_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      username: comment.user.username,
    }));
  }

  async getCommentsCount(photoId: string): Promise<number> {
    return this.commentRepository.count({
      where: { photo_id: photoId },
    });
  }
}
