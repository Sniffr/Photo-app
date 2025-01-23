import { Test, TestingModule } from '@nestjs/testing';
import { LikeController } from './like.controller';
import { LikeService } from '../services/like.service';
import { CreateLikeDto } from '../dtos/create-like.dto';
import { Like } from '../../domain/entities/like.entity';
import { User } from '../../domain/entities/user.entity';
import { Photo } from '../../domain/entities/photo.entity';
// Removed unused import LikeResponseDto

describe('LikeController', () => {
  let controller: LikeController;
  let likeService: LikeService;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    bio: '', // Empty string since TypeScript is not properly handling nullable bio
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPhoto: Photo = {
    id: '1',
    user_id: mockUser.id,
    filename: 'test.jpg',
    url: 'https://example.com/test.jpg',
    caption: 'Test photo',
    hashtags: ['test'],
    created_at: new Date(),
    updated_at: new Date(),
    user: mockUser,
  };

  const mockLike: Like = {
    id: '1',
    user_id: mockUser.id,
    photo_id: '1',
    created_at: new Date(),
    user: mockUser,
    photo: mockPhoto,
  };

  const mockLikeService = {
    create: jest.fn(),
    remove: jest.fn(),
    findByPhotoId: jest.fn(),
    getLikesCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LikeController],
      providers: [
        {
          provide: LikeService,
          useValue: mockLikeService,
        },
      ],
    }).compile();

    controller = module.get<LikeController>(LikeController);
    likeService = module.get<LikeService>(LikeService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('dependency injection', () => {
    it('should inject LikeService', () => {
      expect(likeService).toBeDefined();
    });
  });

  describe('create', () => {
    const createLikeDto: CreateLikeDto = {
      photoId: '1',
    };

    const mockRequest: { user: { sub: string } } = {
      user: { sub: mockUser.id },
    };

    it('should create a like successfully', async (): Promise<void> => {
      const createSpy = jest.spyOn(likeService, 'create');
      createSpy.mockResolvedValueOnce(mockLike);

      const result = await controller.create(mockRequest, createLikeDto);

      expect(result).toBe(mockLike);
      expect(createSpy).toHaveBeenCalledWith(mockUser.id, createLikeDto);
      createSpy.mockRestore();
    });

    it('should handle service errors', async (): Promise<void> => {
      const error = new Error('Service error');
      const createSpy = jest.spyOn(likeService, 'create');
      createSpy.mockRejectedValueOnce(error);

      await expect(
        controller.create(mockRequest, createLikeDto),
      ).rejects.toThrow(error.message);
      createSpy.mockRestore();
    });
  });

  describe('remove', () => {
    const mockRequest: { user: { sub: string } } = {
      user: { sub: mockUser.id },
    };

    it('should remove a like successfully', async (): Promise<void> => {
      const removeSpy = jest.spyOn(likeService, 'remove');
      await controller.remove(mockRequest, '1');

      expect(removeSpy).toHaveBeenCalledWith(mockUser.id, '1');
      removeSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockLikeService.remove.mockRejectedValue(new Error('Service error'));

      await expect(controller.remove(mockRequest, '1')).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('findByPhotoId', () => {
    it('should return likes for a photo', async () => {
      const mockLikes = [mockLike];
      mockLikeService.findByPhotoId.mockResolvedValue(mockLikes);

      const result = await controller.findByPhotoId('1');

      expect(result).toBe(mockLikes);
      const findByPhotoIdSpy = jest.spyOn(likeService, 'findByPhotoId');
      expect(findByPhotoIdSpy).toHaveBeenCalledWith('1');
      findByPhotoIdSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockLikeService.findByPhotoId.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.findByPhotoId('1')).rejects.toThrow(
        'Service error',
      );
    });
  });

  describe('getLikesCount', () => {
    it('should return the number of likes for a photo', async () => {
      mockLikeService.getLikesCount.mockResolvedValue(5);

      const result = await controller.getLikesCount('1');

      expect(result).toEqual({ count: 5 });
      const getLikesCountSpy = jest.spyOn(likeService, 'getLikesCount');
      expect(getLikesCountSpy).toHaveBeenCalledWith('1');
      getLikesCountSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockLikeService.getLikesCount.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getLikesCount('1')).rejects.toThrow(
        'Service error',
      );
    });
  });
});
