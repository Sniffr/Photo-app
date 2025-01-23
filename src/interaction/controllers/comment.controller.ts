import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommentService } from '../services/comment.service';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { RequestWithUser } from '../../auth/interfaces/UserRequest';

@ApiTags('comments')
@Controller('comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('photo/:photoId')
  @ApiOperation({ summary: 'Add a comment to a photo' })
  @ApiResponse({
    status: 201,
    description: 'Comment added successfully',
    type: CommentResponseDto,
  })
  async create(
    @Request() req: RequestWithUser,
    @Param('photoId') photoId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentService.create(req.user.id, photoId, createCommentDto);
  }

  @Get('photo/:photoId')
  @ApiOperation({ summary: 'Get comments for a photo' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of comments for the photo',
    type: [CommentResponseDto],
  })
  async findByPhotoId(@Param('photoId') photoId: string) {
    return this.commentService.findByPhotoId(photoId);
  }

  @Get('photo/:photoId/count')
  @ApiOperation({ summary: 'Get comments count for a photo' })
  @ApiResponse({
    status: 200,
    description: 'Returns number of comments for the photo',
    type: Object,
  })
  async getCommentsCount(@Param('photoId') photoId: string) {
    return { count: await this.commentService.getCommentsCount(photoId) };
  }
}
