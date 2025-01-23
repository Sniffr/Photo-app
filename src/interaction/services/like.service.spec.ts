import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LikeService } from './like.service';
import { Like } from '../../domain/entities/like.entity';
import { Photo } from '../../domain/entities/photo.entity';
import { CreateLikeDto } from '../dtos/create-like.dto';
import { Repository, ObjectLiteral, EntityMetadata, EntityTarget } from 'typeorm';

const createEntityMetadata = (entity: any): EntityMetadata => ({
  "@instanceof": Symbol.for("EntityMetadata"),
  connection: {} as any,
  subscribers: [],
  target: entity,
  tableMetadataArgs: {} as any,
  table: {} as any,
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
  closureJunctionTable: {} as any,
  name: entity.name.toLowerCase(),
  tableName: entity.name.toLowerCase(),
  tablePath: entity.name.toLowerCase(),
  schemaPath: "public",
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
  tableType: "regular",
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
  fileType: "entity",
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
} as unknown as EntityMetadata);

type MockType<T> = {
  [P in keyof T]: P extends 'metadata' | 'manager' | 'target' ? T[P] : jest.Mock;
};

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

describe('LikeService', () => {
  let service: LikeService;
  let likeRepository: MockRepository<Like>;
  let photoRepository: MockRepository<Photo>;

  const mockLike = {
    id: '1',
    user_id: '1',
    photo_id: '1',
    created_at: new Date(),
  };

  const mockPhoto = {
    id: '1',
    user_id: '1',
    filename: 'test.jpg',
    url: 'http://example.com/test.jpg',
  };

  beforeEach(async () => {
    const mockLikeRepository: MockRepository<Like> = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
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
      metadata: createEntityMetadata(Like),
      manager: {} as any,
      hasId: jest.fn(),
      getId: jest.fn(),
      target: jest.fn().mockReturnValue(Like),
      upsert: jest.fn(),
      insert: jest.fn(),
      extend: jest.fn(),
      softRemove: jest.fn(),
      restore: jest.fn(),
      exists: jest.fn(),
      existsBy: jest.fn(),
      findOneBy: jest.fn(),
      findOneById: jest.fn(),
      findByIds: jest.fn(),
      findAndCount: jest.fn(),
      findAndCountBy: jest.fn(),
      countBy: jest.fn(),
      findBy: jest.fn(),
      sum: jest.fn(),
      average: jest.fn(),
      minimum: jest.fn(),
      maximum: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
      queryRunner: jest.fn()
    };

    const mockPhotoRepository: MockRepository<Photo> = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
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
      metadata: createEntityMetadata(Photo),
      manager: {} as any,
      hasId: jest.fn(),
      getId: jest.fn(),
      target: Photo,
      upsert: jest.fn(),
      insert: jest.fn(),
      extend: jest.fn(),
      findOneBy: jest.fn(),
      findOneById: jest.fn(),
      findByIds: jest.fn(),
      findAndCount: jest.fn(),
      findAndCountBy: jest.fn(),
      countBy: jest.fn(),
      findBy: jest.fn(),
      sum: jest.fn(),
      average: jest.fn(),
      minimum: jest.fn(),
      maximum: jest.fn(),
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
      queryRunner: jest.fn(),
      softRemove: jest.fn(),
      restore: jest.fn(),
      exists: jest.fn(),
      existsBy: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikeService,
        {
          provide: getRepositoryToken(Like),
          useValue: mockLikeRepository,
        },
        {
          provide: getRepositoryToken(Photo),
          useValue: mockPhotoRepository,
        },
      ],
    }).compile();

    service = module.get<LikeService>(LikeService);
    likeRepository = module.get(getRepositoryToken(Like));
    photoRepository = module.get(getRepositoryToken(Photo));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dependency injection', () => {
    it('should inject Like repository', () => {
      expect(likeRepository).toBeDefined();
    });

    it('should inject Photo repository', () => {
      expect(photoRepository).toBeDefined();
    });
  });

  describe('create', () => {
    const createLikeDto: CreateLikeDto = {
      photoId: '1',
    };

    it('should create a like successfully', async () => {
      photoRepository.findOne.mockResolvedValue(mockPhoto);
      likeRepository.findOne.mockResolvedValue(null);
      likeRepository.create.mockReturnValue(mockLike);
      likeRepository.save.mockResolvedValue(mockLike);

      const result = await service.create('1', createLikeDto);

      expect(result).toEqual(mockLike);
      expect(photoRepository.findOne).toHaveBeenCalledWith({
        where: { id: createLikeDto.photoId },
      });
      expect(likeRepository.create).toHaveBeenCalledWith({
        user_id: '1',
        photo_id: createLikeDto.photoId,
      });
      expect(likeRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when photo does not exist', async () => {
      photoRepository.findOne.mockResolvedValue(null);

      await expect(service.create('1', createLikeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when like already exists', async () => {
      photoRepository.findOne.mockResolvedValue(mockPhoto);
      likeRepository.findOne.mockResolvedValue(mockLike);

      await expect(service.create('1', createLikeDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a like successfully', async () => {
      likeRepository.findOne.mockResolvedValue(mockLike);
      likeRepository.remove.mockResolvedValue(mockLike);

      await service.remove('1', '1');

      expect(likeRepository.findOne).toHaveBeenCalledWith({
        where: {
          user_id: '1',
          photo_id: '1',
        },
      });
      expect(likeRepository.remove).toHaveBeenCalledWith(mockLike);
    });

    it('should throw NotFoundException when like does not exist', async () => {
      likeRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPhotoId', () => {
    it('should return likes for a photo', async () => {
      const mockLikes = [mockLike];
      likeRepository.find.mockResolvedValue(mockLikes);

      const result = await service.findByPhotoId('1');

      expect(result).toEqual(
        mockLikes.map((like) => ({
          id: like.id,
          userId: like.user_id,
          photoId: like.photo_id,
          createdAt: like.created_at,
        })),
      );
      expect(likeRepository.find).toHaveBeenCalledWith({
        where: { photo_id: '1' },
        relations: ['user'],
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array when no likes exist', async () => {
      likeRepository.find.mockResolvedValue([]);

      const result = await service.findByPhotoId('1');

      expect(result).toEqual([]);
    });
  });

  describe('getLikesCount', () => {
    it('should return the number of likes for a photo', async () => {
      likeRepository.count.mockResolvedValue(5);

      const result = await service.getLikesCount('1');

      expect(result).toBe(5);
      expect(likeRepository.count).toHaveBeenCalledWith({
        where: { photo_id: '1' },
      });
    });

    it('should return 0 when no likes exist', async () => {
      likeRepository.count.mockResolvedValue(0);

      const result = await service.getLikesCount('1');

      expect(result).toBe(0);
    });
  });
});
