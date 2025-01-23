import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
// Removed unused import UpdateProfileDto
import { UserProfileDto } from '../dtos/user-profile.dto';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserProfile: UserProfileDto = {
    id: '1',
    username: 'testuser',
    bio: 'Test bio',
    followersCount: 10,
    followingCount: 5,
    photosCount: 20,
    createdAt: new Date(),
  };

  const mockUserService = {
    getProfile: jest.fn().mockResolvedValue(mockUserProfile),
    updateProfile: jest.fn().mockResolvedValue(mockUserProfile),
    followUser: jest.fn().mockResolvedValue(undefined),
    unfollowUser: jest.fn().mockResolvedValue(undefined),
  };

  const mockRequest = {
    user: {
      sub: '1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async (): Promise<void> => {
      const result = await controller.getProfile('testuser');

      const getProfileSpy = jest.spyOn(userService, 'getProfile');
      expect(result).toBe(mockUserProfile);
      expect(getProfileSpy).toHaveBeenCalledWith('testuser');
      getProfileSpy.mockRestore();
    });
  });

  describe('followUser', () => {
    it('should follow user successfully', async (): Promise<void> => {
      await controller.followUser(mockRequest, 'usertofollow');

      const followUserSpy = jest.spyOn(userService, 'followUser');
      expect(followUserSpy).toHaveBeenCalledWith(
        mockRequest.user.sub,
        'usertofollow',
      );
      followUserSpy.mockRestore();
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow user successfully', async (): Promise<void> => {
      await controller.unfollowUser(mockRequest, 'userunfollow');

      const unfollowUserSpy = jest.spyOn(userService, 'unfollowUser');
      expect(unfollowUserSpy).toHaveBeenCalledWith(
        mockRequest.user.sub,
        'userunfollow',
      );
      unfollowUserSpy.mockRestore();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async (): Promise<void> => {
      const updateProfileDto = {
        username: 'newusername',
        bio: 'New bio',
      };

      const result = await controller.updateProfile(
        mockRequest,
        updateProfileDto,
      );

      const updateProfileSpy = jest.spyOn(userService, 'updateProfile');
      expect(result).toBe(mockUserProfile);
      expect(updateProfileSpy).toHaveBeenCalledWith(
        mockRequest.user.sub,
        updateProfileDto,
      );
      updateProfileSpy.mockRestore();
    });
  });
});
