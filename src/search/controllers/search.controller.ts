import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SearchService } from '../services/search.service';
import { SearchQueryDto } from '../dtos/search-query.dto';
import { User } from '../../domain/entities/user.entity';
import { Photo } from '../../domain/entities/photo.entity';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search for users and photos' })
  @ApiResponse({ status: 200, description: 'Returns search results' })
  async search(
    @Query() searchQueryDto: SearchQueryDto,
  ): Promise<{ users?: User[]; photos?: Photo[] }> {
    const result = await this.searchService.search(searchQueryDto);
    return {
      users: searchQueryDto.username !== undefined ? result?.users : undefined,
      photos: searchQueryDto.hashtag !== undefined ? result?.photos : undefined,
    };
  }
}
