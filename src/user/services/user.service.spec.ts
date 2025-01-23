import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  Repository,
  EntityMetadata,
  ObjectLiteral,
  EntityTarget,
} from 'typeorm';
import { UserService } from './user.service';
import { User } from '../../domain/entities/user.entity';
import { Follow } from '../../domain/entities/follow.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

const createEntityMetadata = (
  entity: new (...args: unknown[]) => User | Follow | Photo,
): EntityMetadata =>
  ({
    '@instanceof': Symbol.for('EntityMetadata'),
    connection: {} as Repository<User | Follow | Photo>['manager'],
    subscribers: [],
    target: entity,
    tableMetadataArgs: {} as EntityMetadata['tableMetadataArgs'],
    table: undefined,
    columns: [],
    relations: [],
    relationIds: [],
    relationCounts: [],
    indices: [],
    uniques: [],
    checks: [],
    exclusions: [],
    embeddeds: [],
    foreignKeys: [],
    propertiesMap: {},
    closureJunctionTable: {} as EntityMetadata['closureJunctionTable'],
    name: entity.name.toLowerCase(),
    tableName: entity.name.toLowerCase(),
    tablePath: entity.name.toLowerCase(),
    schemaPath: 'public',
    orderBy: {},
    discriminatorValue: entity.name.toLowerCase(),
    childEntityMetadatas: [],
    ownColumns: [],
    ownRelations: [],
    ownIndices: [],
    ownUniques: [],
    ownChecks: [],
    ownExclusions: [],
    isClosure: false,
    isJunction: false,
    isAlwaysUsingConstructor: true,
    isJunctionEntityMetadata: false,
    isClosureJunctionEntityMetadata: false,
    tableType: 'regular',
    expression: undefined,
    dependsOn: {},
    relationWithParentMetadata: undefined,
    relationMetadatas: [],
    inheritanceTree: [],
    inheritancePattern: undefined,
    treeType: undefined,
    treeOptions: undefined,
    targetName: entity.name,
    givenTableName: entity.name.toLowerCase(),
    fileType: 'entity',
    engine: undefined,
    database: undefined,
    schema: undefined,
    synchronize: true,
    withoutRowid: false,
    createDateColumn: undefined,
    updateDateColumn: undefined,
    deleteDateColumn: undefined,
    versionColumn: undefined,
    discriminatorColumn: undefined,
    treeLevelColumn: undefined,
    nestedSetLeftColumn: undefined,
    nestedSetRightColumn: undefined,
    materializedPathColumn: undefined,
    objectIdColumn: undefined,
    parentClosureEntityMetadata: undefined,
    parentEntityMetadata: undefined,
    tableNameWithoutPrefix: entity.name.toLowerCase(),
  }) as unknown as EntityMetadata;

// Type for repository methods
type MockRepository<T extends ObjectLiteral> = {
  [P in keyof Repository<T>]: P extends 'metadata'
    ? EntityMetadata
    : P extends 'manager'
      ? Repository<T>['manager']
      : P extends 'target'
        ? EntityTarget<T>
        : jest.Mock;
} & {
  softRemove: jest.Mock;
  restore: jest.Mock;
  exists: jest.Mock;
  existsBy: jest.Mock;
  sum: jest.Mock;
  average: jest.Mock;
  minimum: jest.Mock;
  maximum: jest.Mock;
  findOneOrFail: jest.Mock;
  findOneByOrFail: jest.Mock;
  queryRunner?: jest.Mock;
};

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockRepository<User>;
  let followRepository: MockRepository<Follow>;
  let photoRepository: MockRepository<Photo>;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    bio: 'Test bio',
    created_at: new Date(),
  };

  // Initialize mock repositories
  const mockRepos = {
    userRepo: {
      findOne: jest.fn().mockImplementation(({ where: { username } }) => {
        if (username === 'testuser') {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      findAndCount: jest.fn(),
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
      metadata: createEntityMetadata(User),
      manager: {} as Repository<User>['manager'],
      hasId: jest.fn(),
      getId: jest.fn(),
      target: jest.fn().mockReturnValue(User),
      upsert: jest.fn(),
      insert: jest.fn(),
      extend: jest.fn(),
      release: jest.fn(),
      findOneBy: jest.fn(),
      findOneById: jest.fn(),
      findByIds: jest.fn(),
      findAndCountBy: jest.fn(),
      countBy: jest.fn(),
      findBy: jest.fn(),
    } as unknown as MockRepository<User>,
    followRepo: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
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
      metadata: createEntityMetadata(Follow),
      manager: {} as Repository<Follow>['manager'],
      hasId: jest.fn(),
      getId: jest.fn(),
      target: jest.fn().mockReturnValue(Follow),
      upsert: jest.fn(),
      insert: jest.fn(),
      extend: jest.fn(),
      release: jest.fn(),
      findOneBy: jest.fn(),
      findOneById: jest.fn(),
      findByIds: jest.fn(),
      findAndCountBy: jest.fn(),
      countBy: jest.fn(),
      findBy: jest.fn(),
    } as unknown as MockRepository<Follow>,
    photoRepo: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
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
      metadata: createEntityMetadata(Photo),
      manager: {} as Repository<Photo>['manager'],
      hasId: jest.fn(),
      getId: jest.fn(),
      target: jest.fn().mockReturnValue(Photo),
      upsert: jest.fn(),
      insert: jest.fn(),
      extend: jest.fn(),
      release: jest.fn(),
      findOneBy: jest.fn(),
      findOneById: jest.fn(),
      findByIds: jest.fn(),
      findAndCountBy: jest.fn(),
      countBy: jest.fn(),
      findBy: jest.fn(),
    } as unknown as MockRepository<Photo>,
  };

  beforeEach(async () => {
    // Reset mock implementations
    mockRepos.userRepo.findOne.mockReset();
    mockRepos.followRepo.count.mockReset();
    mockRepos.photoRepo.count.mockReset();

    // Set default mock implementations
    mockRepos.userRepo.findOne.mockResolvedValue(mockUser);
    mockRepos.followRepo.count.mockResolvedValue(0);
    mockRepos.photoRepo.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepos.userRepo,
        },
        {
          provide: getRepositoryToken(Follow),
          useValue: mockRepos.followRepo,
        },
        {
          provide: getRepositoryToken(Photo),
          useValue: mockRepos.photoRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    followRepository = module.get(getRepositoryToken(Follow));
    photoRepository = module.get(getRepositoryToken(Photo));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile with counts when user exists', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      jest.spyOn(followRepository, 'count').mockResolvedValueOnce(10);
      jest.spyOn(followRepository, 'count').mockResolvedValueOnce(5);
      jest.spyOn(photoRepository, 'count').mockResolvedValue(20);

      userRepository.findOne.mockResolvedValueOnce(mockUser);
      const result = await service.getProfile('testuser');

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        bio: mockUser.bio,
        followersCount: 10,
        followingCount: 5,
        photosCount: 20,
        createdAt: mockUser.created_at,
      });
    });

    it('should throw NotFoundException when user does not exist', async (): Promise<void> => {
      // Override the default mock implementation for this test
      userRepository.findOne.mockImplementationOnce(() =>
        Promise.resolve(null),
      );

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle database error during profile fetch', async (): Promise<void> => {
      const dbError = new Error('Database error');
      // Override the default mock implementation for this test
      userRepository.findOne.mockImplementationOnce(() =>
        Promise.reject(dbError),
      );

      await expect(service.getProfile('testuser')).rejects.toThrow(
        dbError.message,
      );
    });
  });

  describe('followUser', () => {
    const followerId = '1';
    const username = 'usertofollow';
    const userToFollow = {
      id: '2',
      username: 'usertofollow',
    };

    it('should follow user successfully', async () => {
      userRepository.findOne.mockResolvedValue(userToFollow);
      followRepository.findOne.mockResolvedValue(null);
      followRepository.create.mockReturnValue({
        follower_id: followerId,
        following_id: userToFollow.id,
      });
      followRepository.save.mockResolvedValue({});

      await service.followUser(followerId, username);

      expect(followRepository.create).toHaveBeenCalledWith({
        follower_id: followerId,
        following_id: userToFollow.id,
      });
      expect(followRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user to follow does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.followUser(followerId, username)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when trying to follow self', async () => {
      userRepository.findOne.mockResolvedValue({
        id: followerId,
        username,
      });

      await expect(service.followUser(followerId, username)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when already following', async () => {
      userRepository.findOne.mockResolvedValue(userToFollow);
      followRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.followUser(followerId, username)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('unfollowUser', () => {
    const followerId = '1';
    const username = 'usertounfollow';
    const userToUnfollow = {
      id: '2',
      username: 'usertounfollow',
    };

    it('should unfollow user successfully', async () => {
      userRepository.findOne.mockResolvedValue(userToUnfollow);
      followRepository.findOne.mockResolvedValue({ id: 1 });
      followRepository.remove.mockResolvedValue({});

      await service.unfollowUser(followerId, username);

      expect(followRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user to unfollow does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.unfollowUser(followerId, username)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when not following the user', async () => {
      userRepository.findOne.mockResolvedValue(userToUnfollow);
      followRepository.findOne.mockResolvedValue(null);

      await expect(service.unfollowUser(followerId, username)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    const userId = '1';
    const updateProfileDto: UpdateProfileDto = {
      username: 'newusername',
      bio: 'New bio',
    };

    it('should update profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateProfileDto };
      // First findOne for getting the user
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      // Second findOne for username uniqueness check
      userRepository.findOne.mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(updatedUser);
      // Third findOne when getting updated profile
      userRepository.findOne.mockResolvedValueOnce(updatedUser);

      // Mock getProfile call counts
      followRepository.count.mockResolvedValueOnce(10);
      followRepository.count.mockResolvedValueOnce(5);
      photoRepository.count.mockResolvedValue(20);

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(result).toEqual({
        id: updatedUser.id,
        username: updatedUser.username,
        bio: updatedUser.bio,
        followersCount: 10,
        followingCount: 5,
        photosCount: 20,
        createdAt: updatedUser.created_at,
      });
    });

    it('should throw NotFoundException when user does not exist', async (): Promise<void> => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, updateProfileDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when username is taken', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.findOne.mockResolvedValueOnce({
        id: '2',
        username: updateProfileDto.username,
      });

      await expect(
        service.updateProfile(userId, updateProfileDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should update only bio when username is not provided', async () => {
      const bioOnlyDto = { bio: 'New bio' };
      const updatedUser = { ...mockUser, bio: bioOnlyDto.bio };

      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(updatedUser);

      // Mock getProfile call
      followRepository.count.mockResolvedValueOnce(10);
      followRepository.count.mockResolvedValueOnce(5);
      photoRepository.count.mockResolvedValue(20);

      const result = await service.updateProfile(userId, bioOnlyDto);

      expect(result.bio).toBe(bioOnlyDto.bio);
      expect(result.username).toBe(mockUser.username);
    });
  });
});
