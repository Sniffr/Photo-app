import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Photo } from '../domain/entities/photo.entity';
import { PhotoService } from './services/photo.service';
import { PhotoController } from './controllers/photo.controller';
import { StorageService } from './services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo])],
  providers: [PhotoService, StorageService],
  controllers: [PhotoController],
  exports: [PhotoService],
})
export class PhotoModule {}
