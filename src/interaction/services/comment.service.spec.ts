import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from '../../domain/entities/comment.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { Repository } from 'typeorm';
import { CreateCommentDto } from '../dtos/create-comment.dto';
import '@jest/globals';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: MockRepository<Comment>;
  let photoRepository: MockRepository<Photo>;

  // Mock data setup
  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockPhoto = {
    id: '1',
    user_id: mockUser.id,
    filename: 'test.jpg',
    url: 'https://example.com/test.jpg',
  };

  const mockComment = {
    id: '1',
    user_id: mockUser.id,
    photo_id: mockPhoto.id,
    content: 'Test comment',
    created_at: new Date(),
    updated_at: new Date(),
    user: mockUser,
  };

  const createCommentDto: CreateCommentDto = {
    content: 'Test comment',
  };

  beforeEach(async () => {
    // Initialize mock repositories with all required methods
    // Initialize mock repositories with all required methods
    const mockCommentRepository: MockRepository<Comment> = {
      create: jest.fn().mockImplementation((dto: Partial<Comment>) => ({
        ...dto,
        id: '1',
        created_at: new Date(),
        updated_at: new Date(),
        user: mockUser,
      })),
      save: jest.fn().mockImplementation((comment) =>
        Promise.resolve({
          ...comment,
          id: '1',
          created_at: new Date(),
          updated_at: new Date(),
          user: mockUser,
        }),
      ),
      findOne: jest.fn().mockResolvedValue(mockComment),
      find: jest.fn().mockResolvedValue([mockComment]),
      remove: jest.fn().mockResolvedValue(mockComment),
      count: jest.fn().mockResolvedValue(5),
    };

    const mockPhotoRepository: MockRepository<Photo> = {
      findOne: jest
        .fn()
        .mockImplementation((options: { where: { id: string } }) => {
          if (options.where.id === '1') {
            return Promise.resolve(mockPhoto);
          }
          return Promise.resolve(null);
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Photo),
          useValue: mockPhotoRepository,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    commentRepository = module.get(getRepositoryToken(Comment));
    photoRepository = module.get(getRepositoryToken(Photo));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('dependency injection', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should inject Comment repository', () => {
      expect(commentRepository).toBeDefined();
    });

    it('should inject Photo repository', () => {
      expect(photoRepository).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      photoRepository.findOne.mockResolvedValue(mockPhoto);
      commentRepository.create.mockReturnValue(mockComment);
      commentRepository.save.mockResolvedValue(mockComment);

      const result = await service.create('1', '1', createCommentDto);

      expect(result).toEqual(mockComment);
      expect(photoRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(commentRepository.create).toHaveBeenCalledWith({
        user_id: '1',
        photo_id: '1',
        content: createCommentDto.content,
      });
      expect(commentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when photo does not exist', async () => {
      photoRepository.findOne.mockResolvedValue(null);

      await expect(service.create('1', '1', createCommentDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPhotoId', () => {
    it('should return comments for a photo', async () => {
      const mockComments = [mockComment];
      commentRepository.find.mockResolvedValue(mockComments);

      const result = await service.findByPhotoId('1');

      expect(result).toEqual(
        mockComments.map((comment) => ({
          id: comment.id,
          userId: comment.user_id,
          photoId: comment.photo_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          username: comment.user.username,
        })),
      );
      expect(commentRepository.find).toHaveBeenCalledWith({
        where: { photo_id: '1' },
        relations: ['user'],
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array when no comments exist', async () => {
      commentRepository.find.mockResolvedValue([]);

      const result = await service.findByPhotoId('1');

      expect(result).toEqual([]);
    });
  });

  describe('getCommentsCount', () => {
    it('should return the number of comments for a photo', async () => {
      commentRepository.count.mockResolvedValue(5);

      const result = await service.getCommentsCount('1');

      expect(result).toBe(5);
      expect(commentRepository.count).toHaveBeenCalledWith({
        where: { photo_id: '1' },
      });
    });

    it('should return 0 when no comments exist', async () => {
      commentRepository.count.mockResolvedValue(0);

      const result = await service.getCommentsCount('1');

      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle repository injection errors', async () => {
      const invalidModule = Test.createTestingModule({
        providers: [CommentService],
      });

      await expect(invalidModule.compile()).rejects.toThrow();
    });

    it('should handle database connection errors in create', async () => {
      photoRepository.findOne.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(service.create('1', '1', createCommentDto)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle database connection errors in findByPhotoId', async () => {
      commentRepository.find.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(service.findByPhotoId('1')).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle database connection errors in getCommentsCount', async () => {
      commentRepository.count.mockRejectedValue(
        new Error('Database connection error'),
      );

      await expect(service.getCommentsCount('1')).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle transaction failures in create', async () => {
      photoRepository.findOne.mockResolvedValue(mockPhoto);
      commentRepository.create.mockReturnValue(mockComment);
      commentRepository.save.mockRejectedValue(new Error('Transaction failed'));

      await expect(service.create('1', '1', createCommentDto)).rejects.toThrow(
        'Transaction failed',
      );
    });
  });
});
