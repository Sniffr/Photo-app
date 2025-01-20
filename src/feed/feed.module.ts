import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '../domain/entities/photo.entity';
import { Follow } from '../domain/entities/follow.entity';
import { FeedService } from './services/feed.service';
import { FeedController } from './controllers/feed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Follow])],
  providers: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
