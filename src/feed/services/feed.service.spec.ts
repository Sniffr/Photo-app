import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, ObjectLiteral } from 'typeorm';
import { FeedService } from './feed.service';
import { Photo } from '../../domain/entities/photo.entity';
import { Follow } from '../../domain/entities/follow.entity';
import { FeedQueryDto } from '../dtos/feed-query.dto';
import '@jest/globals';

describe('FeedService', () => {
  let service: FeedService;
  let photoRepository: MockRepository<Photo>;
  let followRepository: MockRepository<Follow>;

  // Define mock repository type
  type MockType<T> = {
    [P in keyof T]: P extends 'metadata' | 'manager' ? T[P] : jest.Mock;
  };

  type MockRepository<T extends ObjectLiteral> = {
    [P in keyof Repository<T>]: P extends 'metadata' | 'manager' 
      ? Repository<T>[P]
      : jest.Mock;
  };

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
    caption: 'Test photo',
    hashtags: ['test'],
    created_at: new Date(),
    user: mockUser,
  };

  const mockPhotoRepository = {
    find: jest.fn(),
    findAndCount: jest.fn().mockResolvedValue([[mockPhoto], 1]),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    preload: jest.fn(),
    merge: jest.fn(),
    softDelete: jest.fn(),
    recover: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
    clear: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    exist: jest.fn(),
    metadata: {},
    manager: {} as any,
    hasId: jest.fn(),
    getId: jest.fn(),
    target: Photo,
    upsert: jest.fn(),
    insert: jest.fn(),
    extend: jest.fn(),
    release: jest.fn(),
    findOneBy: jest.fn(),
    findOneById: jest.fn(),
    findByIds: jest.fn(),
    findAndCountBy: jest.fn(),
    countBy: jest.fn(),
    findBy: jest.fn()
  } as unknown as MockRepository<Photo>;

  const mockFollowRepository = {
    find: jest.fn().mockResolvedValue([
      { follower_id: '1', following_id: '2' },
      { follower_id: '1', following_id: '3' },
    ]),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    preload: jest.fn(),
    merge: jest.fn(),
    softDelete: jest.fn(),
    recover: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
    clear: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    exist: jest.fn(),
    metadata: {},
    manager: {} as any,
    hasId: jest.fn(),
    getId: jest.fn(),
    target: Follow,
    upsert: jest.fn(),
    insert: jest.fn(),
    extend: jest.fn(),
    release: jest.fn(),
    findOneBy: jest.fn(),
    findOneById: jest.fn(),
    findByIds: jest.fn(),
    findAndCountBy: jest.fn(),
    countBy: jest.fn(),
    findBy: jest.fn()
  } as unknown as MockRepository<Follow>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: getRepositoryToken(Photo),
          useValue: mockPhotoRepository,
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: mockFollowRepository,
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    photoRepository = module.get(getRepositoryToken(Photo));
    followRepository = module.get(getRepositoryToken(Follow));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('dependency injection', () => {
    it('should have FeedService defined', () => {
      expect(service).toBeDefined();
    });

    it('should have PhotoRepository injected', () => {
      expect(photoRepository).toBeDefined();
      expect(photoRepository.findAndCount).toBeDefined();
    });

    it('should have FollowRepository injected', () => {
      expect(followRepository).toBeDefined();
      expect(followRepository.find).toBeDefined();
    });

    it('should handle repository injection errors', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            FeedService,
            // Missing repository providers
          ],
        }).compile(),
      ).rejects.toThrow();
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFeed', () => {
    const mockQuery: FeedQueryDto = {
      page: 1,
      limit: 10,
    };

    it('should return feed with pagination metadata', async () => {
      const result = await service.getFeed('1', mockQuery);

      expect(result).toEqual({
        data: [mockPhoto],
        metadata: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      expect(mockFollowRepository.find).toHaveBeenCalledWith({
        where: { follower_id: '1' },
        select: ['following_id'],
      });

      expect(mockPhotoRepository.findAndCount).toHaveBeenCalledWith({
        where: { user_id: In(['2', '3', '1']) },
        relations: ['user'],
        order: { created_at: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle empty following list', async () => {
      mockFollowRepository.find.mockResolvedValueOnce([]);
      mockPhotoRepository.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.getFeed('1', mockQuery);

      expect(result.data).toEqual([]);
      expect(result.metadata.totalItems).toBe(0);
      expect(result.metadata.totalPages).toBe(0);
    });

    it('should use default pagination values', async () => {
      await service.getFeed('1', {});

      expect(mockPhotoRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should handle repository errors', async () => {
      mockFollowRepository.find.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.getFeed('1', mockQuery)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle pagination correctly', async () => {
      const photos = Array(15).fill(mockPhoto);
      mockPhotoRepository.findAndCount.mockResolvedValueOnce([
        photos.slice(0, 10),
        15,
      ]);

      const result = await service.getFeed('1', { page: 1, limit: 10 });

      expect(result.metadata).toEqual({
        currentPage: 1,
        totalPages: 2,
        totalItems: 15,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should handle last page pagination', async () => {
      const photos = Array(15).fill(mockPhoto);
      mockPhotoRepository.findAndCount.mockResolvedValueOnce([
        photos.slice(10),
        15,
      ]);

      const result = await service.getFeed('1', { page: 2, limit: 10 });

      expect(result.metadata).toEqual({
        currentPage: 2,
        totalPages: 2,
        totalItems: 15,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it("should include user's own photos in feed", async () => {
      mockFollowRepository.find.mockResolvedValueOnce([]);
      await service.getFeed('1', mockQuery);

      const mockCalls = (mockPhotoRepository.findAndCount?.mock?.calls ??
        []) as Array<unknown[]>;
      const findAndCountCall = (mockCalls[0]?.[0] ?? {}) as {
        where: { user_id: typeof In };
        relations: string[];
        order: { created_at: string };
        skip: number;
        take: number;
      };
      expect(findAndCountCall.where?.user_id).toEqual(In(['1']));
    });

    it('should handle invalid page numbers', async () => {
      const result = await service.getFeed('1', { page: -1, limit: 10 });
      expect(result.metadata.currentPage).toBe(1);

      const mockCalls = (mockPhotoRepository.findAndCount?.mock?.calls ??
        []) as Array<unknown[]>;
      const findAndCountCall = (mockCalls[0]?.[0] ?? {}) as {
        where: { user_id: typeof In };
        relations: string[];
        order: { created_at: string };
        skip: number;
        take: number;
      };
      expect(findAndCountCall?.skip).toBe(0);
    });

    it('should handle invalid limit values', async () => {
      const result = await service.getFeed('1', { page: 1, limit: -1 });
      expect(result.metadata.itemsPerPage).toBe(10); // Should use default limit

      const mockCalls = (mockPhotoRepository.findAndCount?.mock?.calls ??
        []) as Array<unknown[]>;
      const findAndCountCall = (mockCalls[0]?.[0] ?? {}) as {
        where: { user_id: typeof In };
        relations: string[];
        order: { created_at: string };
        skip: number;
        take: number;
      };
      expect(findAndCountCall?.take).toBe(10);
    });

    it('should handle photo repository errors', async () => {
      mockFollowRepository.find.mockResolvedValueOnce([]);
      mockPhotoRepository.findAndCount.mockRejectedValueOnce(
        new Error('Photo DB error'),
      );

      await expect(service.getFeed('1', mockQuery)).rejects.toThrow(
        'Photo DB error',
      );
    });
  });
});
