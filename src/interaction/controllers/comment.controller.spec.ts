import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from '../services/comment.service';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { Comment } from '../../domain/entities/comment.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { User } from '../../domain/entities/user.entity';
import '@jest/globals';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: CommentService;

  const mockUser = {
    sub: '1',
    email: 'test@example.com',
    username: 'testuser',
  };

  // Mock data setup
  const createCommentDto: CreateCommentDto = {
    content: 'Test comment',
  };

  const mockRequest = {
    user: { sub: mockUser.sub },
  };

  const mockUserEntity: User = {
    id: mockUser.sub,
    username: mockUser.username,
    email: mockUser.email,
    password: 'hashed',
    bio: '', // Empty string since TypeScript is not properly handling nullable bio
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPhotoEntity: Photo = {
    id: '1',
    user_id: mockUser.sub,
    filename: 'test.jpg',
    url: 'https://example.com/test.jpg',
    caption: 'Test photo',
    hashtags: ['test'],
    created_at: new Date(),
    updated_at: new Date(),
    user: mockUserEntity,
  };

  const mockCommentEntity: Comment = {
    id: '1',
    user_id: mockUser.sub,
    photo_id: '1',
    content: 'Test comment',
    created_at: new Date(),
    updated_at: new Date(),
    user: mockUserEntity,
    photo: mockPhotoEntity,
  };

  const mockCommentResponse: CommentResponseDto = {
    id: '1',
    userId: mockUser.sub,
    photoId: '1',
    content: 'Test comment',
    createdAt: new Date(),
    updatedAt: new Date(),
    username: mockUser.username,
  };

  // Initialize mock service with proper implementations
  const mockCommentService = {
    create: jest
      .fn()
      .mockImplementation(
        (
          userId: string,
          photoId: string,
          dto: CreateCommentDto,
        ): Promise<Comment> => {
          return Promise.resolve({
            ...mockCommentEntity,
            user_id: userId,
            photo_id: photoId,
            content: dto.content,
          });
        },
      ),
    findByPhotoId: jest
      .fn()
      .mockImplementation((photoId: string): Promise<CommentResponseDto[]> => {
        return Promise.resolve([
          {
            id: mockCommentEntity.id,
            userId: mockUser.sub,
            photoId: photoId,
            content: mockCommentEntity.content,
            createdAt: mockCommentEntity.created_at,
            updatedAt: mockCommentEntity.updated_at,
            username: mockUser.username,
          },
        ]);
      }),
    getCommentsCount: jest
      .fn()
      .mockImplementation((photoId: string): Promise<number> => {
        // Use photoId to determine count (5 for valid IDs, 0 for invalid)
        return Promise.resolve(photoId ? 5 : 0);
      }),
  } as unknown as jest.Mocked<CommentService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
      ],
    }).compile();

    controller = module.get<CommentController>(CommentController);
    commentService = module.get<CommentService>(CommentService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('dependency injection', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should inject CommentService', () => {
      expect(commentService).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      mockCommentService.create.mockResolvedValue(mockCommentEntity);

      const result = await controller.create(
        mockRequest,
        '1',
        createCommentDto,
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: mockCommentEntity.id,
          user_id: mockUser.sub,
          photo_id: '1',
          content: createCommentDto.content,
        }),
      );
      const createSpy = jest.spyOn(commentService, 'create');
      expect(createSpy).toHaveBeenCalledWith(
        mockUser.sub,
        '1',
        createCommentDto,
      );
      createSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockCommentService.create.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.create(mockRequest, '1', createCommentDto),
      ).rejects.toThrow('Service error');
    });

    it('should handle empty content in comment', async () => {
      const emptyContentDto = { content: '' };
      mockCommentService.create.mockResolvedValue({
        ...mockCommentEntity,
        content: '',
      });

      const result = await controller.create(mockRequest, '1', emptyContentDto);

      expect(result).toEqual(
        expect.objectContaining({
          content: '',
        }),
      );
    });

    it('should handle missing user in request', async () => {
      const invalidRequest = { user: { sub: '' } };
      mockCommentService.create.mockRejectedValueOnce(
        new Error('Invalid user ID'),
      );

      await expect(
        controller.create(invalidRequest, '1', createCommentDto),
      ).rejects.toThrow('Invalid user ID');
    });

    it('should handle very long content', async () => {
      const longContent = 'a'.repeat(1000);
      const longContentDto = { content: longContent };
      mockCommentService.create.mockResolvedValue({
        ...mockCommentEntity,
        content: longContent,
      });

      const result = await controller.create(mockRequest, '1', longContentDto);

      expect(result).toEqual(
        expect.objectContaining({
          content: longContent,
        }),
      );
    });
  });

  describe('findByPhotoId', () => {
    it('should return comments for a photo', async () => {
      const mockComments = [mockCommentResponse];
      mockCommentService.findByPhotoId.mockResolvedValue(mockComments);

      const result = await controller.findByPhotoId('1');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: mockCommentEntity.id,
            userId: mockUser.sub,
            photoId: '1',
            content: mockCommentEntity.content,
            username: mockUser.username,
          }),
        ]),
      );
      const findByPhotoIdSpy = jest.spyOn(commentService, 'findByPhotoId');
      expect(findByPhotoIdSpy).toHaveBeenCalledWith('1');
      findByPhotoIdSpy.mockRestore();
    });

    it('should return empty array when no comments exist', async () => {
      mockCommentService.findByPhotoId.mockResolvedValue([]);

      const result = await controller.findByPhotoId('1');

      expect(result).toEqual([]);
      const findByPhotoIdSpy = jest.spyOn(commentService, 'findByPhotoId');
      expect(findByPhotoIdSpy).toHaveBeenCalledWith('1');
      findByPhotoIdSpy.mockRestore();
    });

    it('should handle invalid photo ID format', async () => {
      mockCommentService.findByPhotoId.mockRejectedValue(
        new Error('Invalid photo ID'),
      );

      await expect(controller.findByPhotoId('invalid-id')).rejects.toThrow(
        'Invalid photo ID',
      );
    });

    it('should handle service errors', async () => {
      mockCommentService.findByPhotoId.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.findByPhotoId('1')).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle multiple comments', async () => {
      const multipleComments = [
        mockCommentResponse,
        {
          ...mockCommentResponse,
          id: '2',
          content: 'Another comment',
        },
      ];
      mockCommentService.findByPhotoId.mockResolvedValue(multipleComments);

      const result = await controller.findByPhotoId('1');

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: '2',
          content: 'Another comment',
        }),
      );
    });
  });

  describe('getCommentsCount', () => {
    it('should return the number of comments for a photo', async () => {
      mockCommentService.getCommentsCount.mockResolvedValue(5);

      const result = await controller.getCommentsCount('1');

      expect(result).toEqual({ count: 5 });
      const getCommentsCountSpy = jest.spyOn(
        commentService,
        'getCommentsCount',
      );
      expect(getCommentsCountSpy).toHaveBeenCalledWith('1');
      getCommentsCountSpy.mockRestore();
    });

    it('should return zero when no comments exist', async () => {
      mockCommentService.getCommentsCount.mockResolvedValue(0);

      const result = await controller.getCommentsCount('1');

      expect(result).toEqual({ count: 0 });
      const getCommentsCountSpy = jest.spyOn(
        commentService,
        'getCommentsCount',
      );
      expect(getCommentsCountSpy).toHaveBeenCalledWith('1');
      getCommentsCountSpy.mockRestore();
    });

    it('should handle invalid photo ID format', async () => {
      mockCommentService.getCommentsCount.mockRejectedValue(
        new Error('Invalid photo ID'),
      );

      await expect(controller.getCommentsCount('invalid-id')).rejects.toThrow(
        'Invalid photo ID',
      );
    });

    it('should handle service errors', async () => {
      mockCommentService.getCommentsCount.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getCommentsCount('1')).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle large number of comments', async () => {
      const largeCount = 999999;
      mockCommentService.getCommentsCount.mockResolvedValue(largeCount);

      const result = await controller.getCommentsCount('1');

      expect(result).toEqual({ count: largeCount });
    });
  });

  describe('error handling', () => {
    it('should handle service injection errors', async () => {
      const invalidModule = Test.createTestingModule({
        controllers: [CommentController],
      });

      await expect(invalidModule.compile()).rejects.toThrow();
    });

    it('should handle service errors in create', async () => {
      mockCommentService.create.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.create(mockRequest, '1', createCommentDto),
      ).rejects.toThrow('Service error');
    });

    it('should handle service errors in findByPhotoId', async () => {
      mockCommentService.findByPhotoId.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.findByPhotoId('1')).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle service errors in getCommentsCount', async () => {
      mockCommentService.getCommentsCount.mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getCommentsCount('1')).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle invalid request data', async () => {
      const invalidRequest = { user: {} };

      await expect(
        controller.create(
          invalidRequest as { user: { sub: string } },
          '1',
          createCommentDto,
        ),
      ).rejects.toThrow();
    });
  });
});
