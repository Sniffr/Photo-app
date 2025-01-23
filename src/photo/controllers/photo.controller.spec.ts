import { Test, TestingModule } from '@nestjs/testing';
import { PhotoController } from './photo.controller';
import { PhotoService } from '../services/photo.service';
import { CreatePhotoDto } from '../dtos/create-photo.dto';
import { RequestWithUser } from '../../auth/interfaces/UserRequest';

describe('PhotoController', () => {
  let controller: PhotoController;
  let photoService: PhotoService;

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
    updated_at: new Date(),
    user: mockUser,
  };

  const mockPhotoService = {
    create: jest.fn().mockResolvedValue(mockPhoto),
    findOne: jest.fn().mockResolvedValue(mockPhoto),
    findAllByUser: jest.fn().mockResolvedValue([mockPhoto]),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotoController],
      providers: [
        {
          provide: PhotoService,
          useValue: mockPhotoService,
        },
      ],
    }).compile();

    controller = module.get<PhotoController>(PhotoController);
    photoService = module.get<PhotoService>(PhotoService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createPhotoDto: CreatePhotoDto = {
      caption: 'Test photo',
      hashtags: ['test'],
      file: undefined, // This will be passed separately via @UploadedFile()
    };

    const mockFile = {
      fieldname: 'photo',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('test-image'),
      size: 1024 * 1024,
    } as Express.Multer.File;

    const mockRequest = {
      user: {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      },
      headers: {},
      body: {},
    } as RequestWithUser;

    it('should create photo successfully', async () => {
      const result = await controller.create(
        mockRequest,
        createPhotoDto,
        mockFile,
      );

      expect(result).toBe(mockPhoto);
      const createSpy = jest.spyOn(photoService, 'create');
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
        }),
        createPhotoDto,
        mockFile,
      );
    });

    it('should handle service errors', async () => {
      mockPhotoService.create.mockRejectedValueOnce(new Error('Service error'));

      await expect(
        controller.create(mockRequest, createPhotoDto, mockFile),
      ).rejects.toThrow('Service error');
    });
  });

  describe('findAll', () => {
    const mockRequest = {
      user: {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      },
      headers: {},
      body: {},
    } as RequestWithUser;

    it('should return all photos for user', async () => {
      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([mockPhoto]);
      const findAllByUserSpy = jest.spyOn(photoService, 'findAllByUser');
      expect(findAllByUserSpy).toHaveBeenCalledWith(mockUser.id);
      findAllByUserSpy.mockRestore();
    });

    it('should handle service errors', async () => {
      mockPhotoService.findAllByUser.mockRejectedValueOnce(
        new Error('Service error'),
      );

      await expect(controller.findAll(mockRequest)).rejects.toThrow(
        'Service error',
      );
    });

    it('should return empty array when user has no photos', async () => {
      mockPhotoService.findAllByUser.mockResolvedValueOnce([]);

      const result = await controller.findAll(mockRequest);
      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    const mockRequest = {
      user: {
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      },
      headers: {},
      body: {},
    } as RequestWithUser;

    it('should remove photo successfully', async () => {
      await controller.remove(mockRequest, mockPhoto.id);

      const removeSpy = jest.spyOn(photoService, 'remove');
      expect(removeSpy).toHaveBeenCalledWith(mockUser.id, mockPhoto.id);
    });

    it('should handle service errors', async () => {
      mockPhotoService.remove.mockRejectedValueOnce(new Error('Service error'));

      await expect(
        controller.remove(mockRequest, mockPhoto.id),
      ).rejects.toThrow('Service error');
    });
  });
});
