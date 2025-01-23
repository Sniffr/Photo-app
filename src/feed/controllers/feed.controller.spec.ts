import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from '../services/feed.service';
import { FeedQueryDto } from '../dtos/feed-query.dto';
import '@jest/globals';
import { RequestWithUser } from '../../auth/interfaces/UserRequest';

describe('FeedController', () => {
  let controller: FeedController;
  let feedService: FeedService;

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

  const mockFeedService = {
    getFeed: jest.fn().mockResolvedValue({
      data: [mockPhoto],
      metadata: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    }),
  };
  const mockRequest = {
    user: {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
    },
    headers: {},
    body: {},
  } as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedController],
      providers: [
        {
          provide: FeedService,
          useValue: mockFeedService,
        },
      ],
    }).compile();

    controller = module.get<FeedController>(FeedController);
    feedService = module.get<FeedService>(FeedService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should throw BadRequestException when user data is invalid', async () => {
      const invalidRequest = {
        user: { id: '' },
        headers: {},
        body: {},
      } as RequestWithUser;

      await expect(controller.getFeed(invalidRequest, {})).rejects.toThrow(
        BadRequestException,
      );
    });

    const mockQuery: FeedQueryDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated feed', async () => {
      const result = await controller.getFeed(mockRequest, mockQuery);
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
      const getFeedSpy = jest.spyOn(feedService, 'getFeed');
      expect(getFeedSpy).toHaveBeenCalledWith('1', mockQuery);
      getFeedSpy.mockRestore();
    });

    it('should use default pagination values when not provided', async () => {
      await controller.getFeed(mockRequest, {});
      const getFeedSpy = jest.spyOn(feedService, 'getFeed');
      expect(getFeedSpy).toHaveBeenCalledWith('1', {});
      getFeedSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockFeedService.getFeed.mockRejectedValueOnce(new Error('Service error'));
      await expect(controller.getFeed(mockRequest, mockQuery)).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle invalid user in request', async () => {
      const invalidRequest = { user: {} } as RequestWithUser;
      await expect(
        controller.getFeed(invalidRequest, mockQuery),
      ).rejects.toThrow();
    });

    it('should pass pagination parameters correctly', async () => {
      const customQuery = { page: 2, limit: 20 };
      await controller.getFeed(mockRequest, customQuery);
      const getFeedSpy = jest.spyOn(feedService, 'getFeed');
      expect(getFeedSpy).toHaveBeenCalledWith('1', customQuery);
      getFeedSpy.mockRestore();
    });

    it('should return feed data with metadata', async () => {
      const mockResponse = {
        data: [mockPhoto],
        metadata: {
          currentPage: 2,
          totalPages: 5,
          totalItems: 50,
          itemsPerPage: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };
      mockFeedService.getFeed.mockResolvedValueOnce(mockResponse);

      const result = await controller.getFeed(mockRequest, {
        page: 2,
        limit: 10,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty feed results', async () => {
      const emptyResponse = {
        data: [],
        metadata: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      mockFeedService.getFeed.mockResolvedValueOnce(emptyResponse);

      const result = await controller.getFeed(mockRequest, mockQuery);
      expect(result).toEqual(emptyResponse);
    });
  });
});
