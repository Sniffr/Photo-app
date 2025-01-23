import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../services/notification.service';
import {
  NotificationType,
  Notification,
} from '../../domain/entities/notification.entity';
import '@jest/globals';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: NotificationService;

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

  const mockNotificationService = {
    getUserNotifications: jest.fn().mockImplementation((userId: string) => {
      if (userId === '1') {
        return Promise.resolve(
          Object.values(mockNotifications) as Notification[],
        );
      }
      return Promise.resolve([] as Notification[]);
    }) as jest.MockedFunction<(userId: string) => Promise<Notification[]>>,

    markAsRead: jest
      .fn()
      .mockImplementation((userId: string, notificationId: string) => {
        if (!userId || !notificationId) {
          return Promise.reject(new Error('Invalid parameters'));
        }
        return Promise.resolve(undefined);
      }) as jest.MockedFunction<
      (userId: string, notificationId: string) => Promise<void>
    >,

    markAllAsRead: jest.fn().mockImplementation((userId: string) => {
      if (!userId) {
        return Promise.reject(new Error('Invalid user ID'));
      }
      return Promise.resolve(undefined);
    }) as jest.MockedFunction<(userId: string) => Promise<void>>,

    createNotification: jest
      .fn()
      .mockImplementation(
        (userId: string, type: NotificationType, referenceId: string) => {
          if (!userId || !type || !referenceId) {
            return Promise.reject(new Error('Invalid parameters'));
          }
          return Promise.resolve(
            mockNotifications[type.toLowerCase()] as Notification,
          );
        },
      ) as jest.Mock<Promise<Notification>>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get<NotificationService>(NotificationService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserNotifications', () => {
    const mockRequest = { user: { sub: '1' } };

    it('should return user notifications', async () => {
      const result = await controller.getUserNotifications(mockRequest);
      expect(result).toEqual(Object.values(mockNotifications));
      const getUserNotificationsSpy = jest.spyOn(
        notificationService,
        'getUserNotifications',
      );
      expect(getUserNotificationsSpy).toHaveBeenCalledWith('1');
      getUserNotificationsSpy.mockRestore();
    });

    it('should handle service errors', async (): Promise<void> => {
      const error = new Error('Service error');
      const spy = jest.spyOn(notificationService, 'getUserNotifications');
      spy.mockRejectedValueOnce(error);
      await expect(
        controller.getUserNotifications(mockRequest),
      ).rejects.toThrow(error.message);
      spy.mockRestore();
    });
  });

  describe('markAsRead', () => {
    const mockRequest = { user: { sub: '1' } };

    it('should mark notification as read', async () => {
      await controller.markAsRead(mockRequest, '1');
      const markAsReadSpy = jest.spyOn(notificationService, 'markAsRead');
      expect(markAsReadSpy).toHaveBeenCalledWith('1', '1');
      markAsReadSpy.mockRestore();
    });

    it('should handle invalid parameters', async () => {
      const markAsReadSpy = jest.spyOn(notificationService, 'markAsRead');
      markAsReadSpy.mockRejectedValueOnce(new Error('Invalid parameters'));

      await expect(controller.markAsRead(mockRequest, '')).rejects.toThrow(
        'Invalid parameters',
      );
      markAsReadSpy.mockRestore();
    });
  });

  describe('markAllAsRead', () => {
    const mockRequest = { user: { sub: '1' } };

    it('should mark all notifications as read', async () => {
      await controller.markAllAsRead(mockRequest);
      const markAllAsReadSpy = jest.spyOn(notificationService, 'markAllAsRead');
      expect(markAllAsReadSpy).toHaveBeenCalledWith('1');
      markAllAsReadSpy.mockRestore();
    });

    it('should handle service errors', async (): Promise<void> => {
      const markAllAsReadSpy = jest.spyOn(notificationService, 'markAllAsRead');
      markAllAsReadSpy.mockRejectedValueOnce(new Error('Invalid user ID'));

      await expect(controller.markAllAsRead(mockRequest)).rejects.toThrow(
        'Invalid user ID',
      );
      markAllAsReadSpy.mockRestore();
    });
  });
});
