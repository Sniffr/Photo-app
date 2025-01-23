import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../domain/entities/like.entity';
import { Comment } from '../domain/entities/comment.entity';
import { Photo } from '../domain/entities/photo.entity';
import { LikeService } from './services/like.service';
import { CommentService } from './services/comment.service';
import { LikeController } from './controllers/like.controller';
import { CommentController } from './controllers/comment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Comment, Photo])],
  providers: [LikeService, CommentService],
  controllers: [LikeController, CommentController],
  exports: [LikeService, CommentService],
})
export class InteractionModule {}
