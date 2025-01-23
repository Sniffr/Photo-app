import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PhotoService } from '../services/photo.service';
import { CreatePhotoDto } from '../dtos/create-photo.dto';
import { PhotoResponseDto } from '../dtos/photo-response.dto';
import { User } from '../../domain/entities/user.entity';
import { RequestWithUser } from '../../auth/interfaces/UserRequest';

@ApiTags('photos')
@Controller('photos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a new photo' })
  @ApiResponse({
    status: 201,
    description: 'Photo uploaded successfully',
    type: PhotoResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Request() req: RequestWithUser,
    @Body() createPhotoDto: CreatePhotoDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
    } as User;
    return this.photoService.create(user, createPhotoDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all photos for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of photos',
    type: [PhotoResponseDto],
  })
  async findAll(@Request() req: RequestWithUser) {
    return this.photoService.findAllByUser(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted successfully' })
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.photoService.remove(req.user.id, id);
  }
}
