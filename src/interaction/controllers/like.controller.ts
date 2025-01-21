import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  Get,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LikeService } from '../services/like.service';
import { CreateLikeDto } from '../dtos/create-like.dto';
import { LikeResponseDto } from '../dtos/like-response.dto';

@ApiTags('likes')
@Controller('likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @ApiOperation({ summary: 'Like a photo' })
  @ApiResponse({
    status: 201,
    description: 'Photo liked successfully',
    type: LikeResponseDto,
  })
  async create(
    @Request() req: { user: { sub: string } },
    @Body() createLikeDto: CreateLikeDto,
  ) {
    return this.likeService.create(req.user.sub, createLikeDto);
  }

  @Delete(':photoId')
  @ApiOperation({ summary: 'Unlike a photo' })
  @ApiResponse({ status: 200, description: 'Photo unliked successfully' })
  async remove(
    @Request() req: { user: { sub: string } },
    @Param('photoId') photoId: string,
  ) {
    return this.likeService.remove(req.user.sub, photoId);
  }

  @Get('photo/:photoId')
  @ApiOperation({ summary: 'Get likes for a photo' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of likes for the photo',
  })
  async findByPhotoId(@Param('photoId') photoId: string) {
    return this.likeService.findByPhotoId(photoId);
  }

  @Get('photo/:photoId/count')
  @ApiOperation({ summary: 'Get likes count for a photo' })
  @ApiResponse({
    status: 200,
    description: 'Returns number of likes for the photo',
  })
  async getLikesCount(@Param('photoId') photoId: string) {
    return { count: await this.likeService.getLikesCount(photoId) };
  }
}
