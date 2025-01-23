import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { StorageService } from './storage.service';
import { Photo } from '../../domain/entities/photo.entity';
import { User } from '../../domain/entities/user.entity';
import { Repository } from 'typeorm';
import { CreatePhotoDto } from '../dtos/create-photo.dto';
import * as sharp from 'sharp';

// Define mock repository type that combines Repository and Jest mock methods
type MockType<T> = {
  [P in keyof T]?: jest.Mock;
};

type MockRepository<T> = MockType<Repository<T>>;

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation((buffer) => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(buffer),
  }));
});

describe('PhotoService', () => {
  let service: PhotoService;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    bio: 'Test bio',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPhoto: Photo = {
    id: '1',
    user_id: mockUser.id,
    filename: 'test.jpg',
    url: 'https://example.com/test.jpg',
    caption: 'Test photo',
    hashtags: ['test'],
    created_at: new Date(),
    updated_at: new Date(),
    user: {
      ...mockUser,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };

  const mockPhotoRepository: MockRepository<Photo> = {
    create: jest.fn().mockImplementation(
      (dto: Partial<Photo>): Photo =>
        ({
          ...dto,
          id: '1',
          created_at: new Date(),
          updated_at: new Date(),
        }) as Photo,
    ),
    save: jest.fn().mockImplementation(
      (photo: Partial<Photo>): Promise<Photo> =>
        Promise.resolve({
          ...photo,
          id: '1',
          created_at: new Date(),
          updated_at: new Date(),
        } as Photo),
    ),
    findOne: jest
      .fn()
      .mockImplementation((): Promise<Photo> => Promise.resolve(mockPhoto)),
    find: jest
      .fn()
      .mockImplementation((): Promise<Photo[]> => Promise.resolve([mockPhoto])),
    remove: jest
      .fn()
      .mockImplementation(
        (photo: Photo): Promise<Photo> => Promise.resolve(photo),
      ),
  };

  const mockUserRepository: MockRepository<User> = {
    findOne: jest
      .fn()
      .mockImplementation((): Promise<User> => Promise.resolve(mockUser)),
  };

  const mockStorageService: MockType<StorageService> = {
    uploadFile: jest
      .fn()
      .mockImplementation(
        (): Promise<{ url: string }> => Promise.resolve({ url: mockPhoto.url }),
      ),
    deleteFile: jest
      .fn()
      .mockImplementation((): Promise<void> => Promise.resolve()),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'photo',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-image'),
    size: 1024 * 1024, // 1MB
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as NodeJS.ReadStream,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: getRepositoryToken(Photo),
          useValue: mockPhotoRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<PhotoService>(PhotoService);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Reset mock implementations to defaults
    jest.clearAllMocks();
    mockPhotoRepository.create.mockImplementation(
      (dto: Partial<Photo>): Photo =>
        ({
          ...dto,
          id: '1',
          created_at: new Date(),
          updated_at: new Date(),
        }) as Photo,
    );
    mockPhotoRepository.save.mockImplementation(
      (photo: Partial<Photo>): Promise<Photo> =>
        Promise.resolve({
          ...photo,
          id: '1',
          created_at: new Date(),
          updated_at: new Date(),
        } as Photo),
    );
    mockPhotoRepository.findOne.mockImplementation(() =>
      Promise.resolve(mockPhoto),
    );
    mockPhotoRepository.find.mockImplementation(() =>
      Promise.resolve([mockPhoto]),
    );
    mockPhotoRepository.remove.mockImplementation((photo) =>
      Promise.resolve(photo),
    );
    mockStorageService.uploadFile.mockImplementation(() =>
      Promise.resolve({ url: mockPhoto.url }),
    );
    mockStorageService.deleteFile.mockImplementation(() => Promise.resolve());
  });

  afterAll(() => {
    jest.resetModules();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPhotoDto: CreatePhotoDto = {
      caption: 'Test photo',
      hashtags: ['test'],
      file: mockFile, // Include file in DTO even though it's passed separately
    };

    it('should create a photo successfully', async (): Promise<void> => {
      const result = await service.create(mockUser, createPhotoDto, mockFile);

      expect(sharp).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          originalname: mockFile.originalname,
          mimetype: mockFile.mimetype,
          fieldname: mockFile.fieldname,
        }),
      );
      expect(mockPhotoRepository.create).toHaveBeenCalledWith({
        user_id: mockUser.id,
        filename: mockFile.originalname,
        url: mockPhoto.url,
        caption: createPhotoDto.caption,
        hashtags: createPhotoDto.hashtags,
      });
      expect(mockPhotoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          filename: mockFile.originalname,
          url: mockPhoto.url,
          caption: createPhotoDto.caption,
          hashtags: createPhotoDto.hashtags,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          user_id: mockUser.id,
          filename: mockFile.originalname,
          url: mockPhoto.url,
          caption: createPhotoDto.caption,
          hashtags: createPhotoDto.hashtags,
        }),
      );
    });

    it('should throw BadRequestException for invalid file type', async (): Promise<void> => {
      const invalidFile = { ...mockFile, mimetype: 'text/plain' };
      await expect(
        service.create(mockUser, createPhotoDto, invalidFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file too large', async (): Promise<void> => {
      const largeFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB
      await expect(
        service.create(mockUser, createPhotoDto, largeFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when no file is provided', async (): Promise<void> => {
      await expect(
        service.create(mockUser, createPhotoDto, null),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByUser', () => {
    it('should return array of photos for user', async () => {
      const result = await service.findAllByUser(mockUser.id);

      expect(result).toEqual([mockPhoto]);
      expect(mockPhotoRepository.find).toHaveBeenCalledWith({
        where: { user_id: mockUser.id },
        order: { created_at: 'DESC' },
      });
    });

    it('should return empty array when user has no photos', async () => {
      mockPhotoRepository.find.mockResolvedValueOnce([]);

      const result = await service.findAllByUser(mockUser.id);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockPhotoRepository.find.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.findAllByUser(mockUser.id)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findOne', () => {
    it('should return a photo when it exists', async () => {
      const result = await service.findOne(mockPhoto.id);

      expect(result).toMatchObject({
        user_id: mockUser.id,
        filename: mockPhoto.filename,
        url: mockPhoto.url,
        caption: mockPhoto.caption,
        hashtags: mockPhoto.hashtags,
      });
      expect(mockPhotoRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPhoto.id },
        relations: ['user'],
      });
    });

    it('should throw NotFoundException when photo does not exist', async () => {
      mockPhotoRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove photo when user owns it', async () => {
      await service.remove(mockUser.id, mockPhoto.id);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        expect.any(String),
      );
      expect(mockPhotoRepository.remove).toHaveBeenCalledWith(mockPhoto);
    });

    it('should throw BadRequestException when user does not own the photo', async () => {
      const differentUserId = '2';

      await expect(
        service.remove(differentUserId, mockPhoto.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when photo does not exist', async () => {
      mockPhotoRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.remove(mockUser.id, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle storage service errors', async () => {
      mockStorageService.deleteFile.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      await expect(service.remove(mockUser.id, mockPhoto.id)).rejects.toThrow(
        'Storage error',
      );
    });
  });
});
