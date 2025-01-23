import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../domain/entities/user.entity';
import { Photo } from '../domain/entities/photo.entity';
import { SearchService } from './services/search.service';
import { SearchController } from './controllers/search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Photo])],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
