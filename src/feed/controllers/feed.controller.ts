import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FeedService } from '../services/feed.service';
import { FeedQueryDto } from '../dtos/feed-query.dto';
import { PhotoResponseDto } from '../../photo/dtos/photo-response.dto';
import { RequestWithUser } from '../../auth/interfaces/UserRequest';

@ApiTags('feed')
@Controller('feed')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get user feed with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated feed of photos',
    type: PhotoResponseDto,
    isArray: true,
  })
  async getFeed(@Request() req: RequestWithUser, @Query() query: FeedQueryDto) {
    if (!req?.user?.id) {
      throw new BadRequestException('Invalid user data');
    }
    return this.feedService.getFeed(req.user.id, query);
  }
}
