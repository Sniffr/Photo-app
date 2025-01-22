import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { SearchQueryDto } from '../dtos/search-query.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  async searchUsers(query: string): Promise<User[]> {
    return this.userRepository.find({
      where: {
        username: Like(`%${query}%`),
      },
      select: ['id', 'username', 'bio', 'created_at'],
    });
  }

  async searchPhotos(query: string): Promise<Photo[]> {
    return this.photoRepository.find({
      where: [
        { caption: Like(`%${query}%`) },
        { hashtags: Like(`%${query}%`) },
      ],
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async search(searchQueryDto: SearchQueryDto): Promise<{
    users?: User[];
    photos?: Photo[];
  }> {
    const { username, hashtag } = searchQueryDto;
    const results = {
      users: undefined as User[] | undefined,
      photos: undefined as Photo[] | undefined,
    };

    if (username) {
      results.users = await this.searchUsers(username);
    }

    if (hashtag) {
      results.photos = await this.searchPhotos(hashtag);
    }

    return results;
  }
}
