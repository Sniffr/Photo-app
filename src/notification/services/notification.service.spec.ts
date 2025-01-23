import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import {
  Notification,
  NotificationType,
} from '../../domain/entities/notification.entity';
import {
  Repository,
  EntityMetadata,
  ObjectLiteral,
  EntityTarget,
} from 'typeorm';

const createEntityMetadata = (
  entity: new (...args: unknown[]) => Notification,
): EntityMetadata =>
  ({
    '@instanceof': Symbol.for('EntityMetadata'),
    connection: {} as Repository<Notification>['manager'],
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

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: MockRepository<Notification>;

  const mockNotifications = {
    like: {
      id: '1',
      user_id: '1',
      type: NotificationType.LIKE,
      reference_id: '123',
      read: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    comment: {
      id: '2',
      user_id: '1',
      type: NotificationType.COMMENT,
      reference_id: '456',
      read: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
    follow: {
      id: '3',
      user_id: '1',
      type: NotificationType.FOLLOW,
      reference_id: '789',
      read: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  const mockNotificationRepository: MockRepository<Notification> = {
    find: jest
      .fn()
      .mockImplementation((options: { where: { user_id: string } }) => {
        if (options?.where?.user_id === '1') {
          return Promise.resolve(
            Object.values(mockNotifications) as Notification[],
          );
        }
        return Promise.resolve([] as Notification[]);
      }),
    create: jest.fn().mockImplementation((dto: Partial<Notification>) => {
      const type = dto.type?.toLowerCase() as keyof typeof mockNotifications;
      if (type && mockNotifications[type]) {
        return {
          ...mockNotifications[type],
          ...dto,
        } as Notification;
      }
      return dto as Notification;
    }),
    save: jest.fn().mockImplementation((notification: Notification) => {
      const type =
        notification.type?.toLowerCase() as keyof typeof mockNotifications;
      if (type && mockNotifications[type]) {
        return Promise.resolve({
          ...mockNotifications[type],
          ...notification,
        } as Notification);
      }
      return Promise.resolve(notification);
    }),
    update: jest
      .fn()
      .mockImplementation(
        (
          where: { user_id?: string; id?: string },
          updates: Partial<Notification>,
        ) => {
          const { user_id, id } = where || {};
          if (!user_id && !id) {
            return Promise.reject(new Error('Invalid update criteria'));
          }
          // Use updates to validate the update operation
          if (!updates || Object.keys(updates).length === 0) {
            return Promise.reject(new Error('No updates provided'));
          }
          return Promise.resolve({ affected: 1 });
        },
      ),
    delete: jest
      .fn()
      .mockImplementation(() => Promise.resolve({ affected: 1 })),
    findOne: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
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
    metadata: createEntityMetadata(Notification),
    manager: {} as Repository<Notification>['manager'],
    hasId: jest.fn(),
    getId: jest.fn(),
    target: jest.fn().mockReturnValue(Notification),
    upsert: jest.fn(),
    insert: jest.fn(),
    extend: jest.fn(),

    findOneBy: jest.fn(),
    findOneById: jest.fn(),
    findByIds: jest.fn(),
    findAndCountBy: jest.fn(),
    countBy: jest.fn(),
    findBy: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    exists: jest.fn(),
    existsBy: jest.fn(),
    sum: jest.fn(),
    average: jest.fn(),
    minimum: jest.fn(),
    maximum: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    queryRunner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get(getRepositoryToken(Notification));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a like notification successfully', async () => {
      const result = await service.createNotification(
        '1',
        NotificationType.LIKE,
        '123',
      );
      expect(result).toEqual(mockNotifications.like);
      expect(notificationRepository.create).toHaveBeenCalledWith({
        user_id: '1',
        type: NotificationType.LIKE,
        reference_id: '123',
        read: false,
      });
      expect(notificationRepository.save).toHaveBeenCalled();
    });

    it('should create a comment notification successfully', async () => {
      const result = await service.createNotification(
        '1',
        NotificationType.COMMENT,
        '456',
      );
      expect(result).toEqual(mockNotifications.comment);
    });

    it('should create a follow notification successfully', async () => {
      const result = await service.createNotification(
        '1',
        NotificationType.FOLLOW,
        '789',
      );
      expect(result).toEqual(mockNotifications.follow);
    });

    it('should handle database errors', async (): Promise<void> => {
      const saveSpy = jest.spyOn(notificationRepository, 'save');
      saveSpy.mockRejectedValueOnce(new Error('Database error'));
      await expect(
        service.createNotification('1', NotificationType.LIKE, '123'),
      ).rejects.toThrow('Database error');
      saveSpy.mockRestore();
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const result = await service.getUserNotifications('1');
      expect(result).toEqual(Object.values(mockNotifications));
      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: { user_id: '1' },
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array for user with no notifications', async () => {
      const result = await service.getUserNotifications('2');
      expect(result).toEqual([]);
    });

    it('should handle database errors in getUserNotifications', async (): Promise<void> => {
      const findSpy = jest.spyOn(notificationRepository, 'find');
      findSpy.mockRejectedValueOnce(new Error('Database error'));
      await expect(service.getUserNotifications('1')).rejects.toThrow(
        'Database error',
      );
      findSpy.mockRestore();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await service.markAsRead('1', '1');
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { id: '1', user_id: '1' },
        { read: true },
      );
    });

    it('should handle invalid update criteria', async () => {
      notificationRepository.update.mockRejectedValueOnce(
        new Error('Invalid update criteria'),
      );
      await expect(service.markAsRead('', '')).rejects.toThrow(
        'Invalid update criteria',
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      await service.markAllAsRead('1');
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { user_id: '1' },
        { read: true },
      );
    });

    it('should handle database errors in markAllAsRead', async (): Promise<void> => {
      const updateSpy = jest.spyOn(notificationRepository, 'update');
      updateSpy.mockRejectedValueOnce(new Error('Database error'));
      await expect(service.markAllAsRead('1')).rejects.toThrow(
        'Database error',
      );
      updateSpy.mockRestore();
    });
  });
});
