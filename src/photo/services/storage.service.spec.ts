import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
// AWS S3 types are only used for mocking
import { BadRequestException } from '@nestjs/common';

// Mock AWS S3
interface MockS3Instance {
  upload: jest.Mock;
  deleteObject: jest.Mock;
}

const mockS3Instance: MockS3Instance = {
  upload: jest.fn(),
  deleteObject: jest.fn(),
};

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => mockS3Instance),
}));

describe('StorageService', () => {
  let service: StorageService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AWS_S3_BUCKET: 'test-bucket',
        AWS_REGION: 'us-east-1',
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
      };
      return config[key] as string;
    }),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-image'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: null as unknown as NodeJS.ReadStream,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);

    // Reset mock implementations
    const defaultUploadResult = {
      Location: 'https://test-bucket.s3.amazonaws.com/test.jpg',
      Key: 'test.jpg',
    };

    const defaultUploadPromise = jest
      .fn()
      .mockResolvedValue(defaultUploadResult);
    const defaultDeletePromise = jest.fn().mockResolvedValue({});

    mockS3Instance.upload.mockReturnValue({ promise: defaultUploadPromise });
    mockS3Instance.deleteObject.mockReturnValue({
      promise: defaultDeletePromise,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async (): Promise<void> => {
      const mockUploadResult = {
        Location: 'https://test-bucket.s3.amazonaws.com/test.jpg',
        Key: 'test.jpg',
      };

      const uploadPromise = jest.fn().mockResolvedValue(mockUploadResult);
      mockS3Instance.upload.mockReturnValueOnce({ promise: uploadPromise });

      const result = await service.uploadFile(mockFile);

      expect(result).toEqual({
        url: mockUploadResult.Location,
        key: mockUploadResult.Key,
      });
      expect(mockS3Instance.upload).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.any(String),
        Body: mockFile.buffer,
        ContentType: mockFile.mimetype,
        ACL: 'public-read',
      });
    });

    it('should handle upload errors', async (): Promise<void> => {
      mockS3Instance.upload.mockImplementationOnce(() => ({
        promise: jest.fn().mockRejectedValue(new Error('Upload failed')),
      }));

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'Upload failed',
      );
    });

    it('should handle missing file', async (): Promise<void> => {
      await expect(
        service.uploadFile(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle missing buffer', async (): Promise<void> => {
      const invalidFile = {
        ...mockFile,
        buffer: undefined,
      } as unknown as Express.Multer.File;

      await expect(service.uploadFile(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async (): Promise<void> => {
      const deletePromise = jest.fn().mockResolvedValue({});
      mockS3Instance.deleteObject.mockReturnValueOnce({
        promise: deletePromise,
      });

      await service.deleteFile('test.jpg');

      expect(mockS3Instance.deleteObject).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test.jpg',
      });
    });

    it('should handle delete errors', async (): Promise<void> => {
      mockS3Instance.deleteObject.mockImplementationOnce(() => ({
        promise: jest.fn().mockRejectedValue(new Error('Delete failed')),
      }));

      await expect(service.deleteFile('test.jpg')).rejects.toThrow(
        'Delete failed',
      );
    });

    it('should handle missing key', async (): Promise<void> => {
      await expect(service.deleteFile('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('configuration', () => {
    it('should initialize with correct AWS configuration', (): void => {
      expect(mockConfigService.get).toHaveBeenCalledWith('AWS_S3_BUCKET');
      expect(mockConfigService.get).toHaveBeenCalledWith('AWS_REGION');
      expect(mockConfigService.get).toHaveBeenCalledWith('AWS_ACCESS_KEY_ID');
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'AWS_SECRET_ACCESS_KEY',
      );
    });

    it('should handle missing AWS configuration', async (): Promise<void> => {
      const mockEmptyConfig = {
        get: jest.fn(() => undefined),
      };

      await expect(async () => {
        const testModule = await Test.createTestingModule({
          providers: [
            StorageService,
            {
              provide: ConfigService,
              useValue: mockEmptyConfig,
            },
          ],
        }).compile();

        return testModule.get<StorageService>(StorageService);
      }).rejects.toThrow();
    });

    it('should handle S3 upload errors', async (): Promise<void> => {
      const uploadError = new Error('S3 upload failed');
      const uploadPromise = jest.fn().mockRejectedValue(uploadError);
      mockS3Instance.upload.mockReturnValueOnce({ promise: uploadPromise });

      await expect(service.uploadFile(mockFile)).rejects.toThrow(uploadError);
    });

    it('should handle invalid file types', async (): Promise<void> => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      await expect(service.uploadFile(invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle files exceeding size limit', async (): Promise<void> => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024, // 11MB
      } as Express.Multer.File;

      await expect(service.uploadFile(largeFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    describe('deleteFile', () => {
      it('should handle S3 deletion errors', async () => {
        const deleteError = new Error('S3 delete failed');
        const deletePromise = jest.fn().mockRejectedValue(deleteError);
        mockS3Instance.deleteObject.mockReturnValueOnce({
          promise: deletePromise,
        });

        await expect(service.deleteFile('test.jpg')).rejects.toThrow(
          deleteError,
        );
      });

      it('should handle empty key parameter', async () => {
        await expect(service.deleteFile('')).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle undefined key parameter', async () => {
        await expect(service.deleteFile(undefined)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle null key parameter', async () => {
        await expect(service.deleteFile(null)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('file validation', () => {
      it('should handle empty file name', async () => {
        const noNameFile = {
          ...mockFile,
          originalname: '',
        } as Express.Multer.File;

        await expect(service.uploadFile(noNameFile)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle missing mimetype', async () => {
        const noMimetypeFile = {
          ...mockFile,
          mimetype: '',
        } as Express.Multer.File;

        await expect(service.uploadFile(noMimetypeFile)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should handle zero byte files', async () => {
        const emptyFile = {
          ...mockFile,
          size: 0,
          buffer: Buffer.from(''),
        } as Express.Multer.File;

        // Mock S3 upload to fail for empty files
        mockS3Instance.upload.mockImplementationOnce(() => ({
          promise: jest.fn().mockRejectedValue(new Error('Empty file')),
        }));

        await expect(service.uploadFile(emptyFile)).rejects.toThrow(
          'Empty file',
        );
      });
    });
  });
});
