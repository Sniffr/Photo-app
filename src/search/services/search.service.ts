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

  private escapeSpecialChars(query: string): string {
    return query.replace(/[%_]/g, '\\\\$&');
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!query) return [];
    const escapedQuery = this.escapeSpecialChars(query);
    return this.userRepository.find({
      where: {
        username: Like(`%${escapedQuery}%`),
      },
      select: ['id', 'username', 'bio', 'created_at'],
    });
  }

  async searchPhotos(query: string): Promise<Photo[]> {
    if (!query) return [];
    const escapedQuery = this.escapeSpecialChars(query);
    return this.photoRepository.find({
      where: [
        { caption: Like(`%${escapedQuery}%`) },
        { hashtags: Like(`%${escapedQuery}%`) },
      ],
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async search(searchQueryDto: SearchQueryDto): Promise<{
    users: User[];
    photos: Photo[];
  }> {
    const { username, hashtag } = searchQueryDto;

    // Handle empty/null/undefined parameters
    if (!username && !hashtag) {
      return { users: [], photos: [] };
    }

    const [users, photos]: [User[], Photo[]] = await Promise.all([
      username ? this.searchUsers(username) : Promise.resolve<User[]>([]),
      hashtag ? this.searchPhotos(hashtag) : Promise.resolve<Photo[]>([]),
    ]);

    return { users, photos };
  }
}
