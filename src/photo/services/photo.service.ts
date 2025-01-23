import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from '../../domain/entities/photo.entity';
import { CreatePhotoDto } from '../dtos/create-photo.dto';
import { User } from '../../domain/entities/user.entity';
import { FileValidationOptions } from '../interfaces/storage-config.interface';
import { StorageService } from './storage.service';
import * as sharp from 'sharp';

@Injectable()
export class PhotoService {
  private readonly validationOptions: FileValidationOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
  };

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    user: User,
    createPhotoDto: CreatePhotoDto,
    file: Express.Multer.File,
  ): Promise<Photo> {
    this.validateFile(file);

    // Process image with sharp
    const processedImageBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // Update file buffer with processed image
    file.buffer = processedImageBuffer;

    // Upload to S3
    const uploadResult = await this.storageService.uploadFile(file);

    // Create photo entity
    const photo = this.photoRepository.create({
      user_id: user.id,
      filename: file.originalname,
      url: uploadResult.url,
      caption: createPhotoDto.caption,
      hashtags:
        typeof createPhotoDto.hashtags === 'string'
          ? (JSON.parse(createPhotoDto.hashtags) as string[])
          : (createPhotoDto.hashtags ?? []),
    });

    return this.photoRepository.save(photo);
  }

  async findAllByUser(userId: string): Promise<Photo[]> {
    return this.photoRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    return photo;
  }

  async remove(userId: string, id: string): Promise<void> {
    const photo = await this.findOne(id);

    if (photo.user_id !== userId) {
      throw new BadRequestException('You can only delete your own photos');
    }

    // Extract key from URL
    const key = photo.url.split('/').pop();
    if (key) {
      await this.storageService.deleteFile(key);
    }

    await this.photoRepository.remove(photo);
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > this.validationOptions.maxSize) {
      throw new BadRequestException(
        `File size exceeds ${this.validationOptions.maxSize / 1024 / 1024}MB limit`,
      );
    }

    if (!this.validationOptions.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: ' +
          this.validationOptions.allowedMimeTypes.join(', '),
      );
    }
  }
}
