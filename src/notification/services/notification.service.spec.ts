import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import {
  Notification,
  NotificationType,
} from '../../domain/entities/notification.entity';
import { Repository } from 'typeorm';

import { ObjectLiteral } from 'typeorm';

type MockRepository<T extends ObjectLiteral> = {
  [P in keyof Repository<T>]?: jest.Mock<any, any>;
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
