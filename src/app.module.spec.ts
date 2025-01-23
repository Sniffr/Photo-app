import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PhotoModule } from './photo/photo.module';
import { FeedModule } from './feed/feed.module';
import { InteractionModule } from './interaction/interaction.module';
import { SearchModule } from './search/search.module';
import { NotificationModule } from './notification/notification.module';

// Mock feature modules
jest.mock('./auth/auth.module', () => ({
  AuthModule: jest.fn(),
}));
jest.mock('./user/user.module', () => ({
  UserModule: jest.fn(),
}));
jest.mock('./photo/photo.module', () => ({
  PhotoModule: jest.fn(),
}));
jest.mock('./feed/feed.module', () => ({
  FeedModule: jest.fn(),
}));
jest.mock('./interaction/interaction.module', () => ({
  InteractionModule: jest.fn(),
}));
jest.mock('./search/search.module', () => ({
  SearchModule: jest.fn(),
}));
jest.mock('./notification/notification.module', () => ({
  NotificationModule: jest.fn(),
}));

const mockConfigService = {
  get: jest.fn((key: string): string => {
    const config: Record<string, string> = {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USERNAME: 'postgres',
      DB_PASSWORD: 'postgres',
      DB_NAME: 'photo_inc',
      NODE_ENV: 'test',
    };
    return config[key] ?? '';
  }),
};

const mockDataSource = {
  initialize: jest
    .fn()
    .mockImplementation((): Promise<void> => Promise.resolve()),
  destroy: jest.fn().mockImplementation((): Promise<void> => Promise.resolve()),
  createQueryRunner: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  })),
};

describe('AppModule', () => {
  let testModule: TestingModule;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .compile();

    testModule = module;
  });

  it('should be defined', () => {
    expect(testModule).toBeDefined();
  });

  it('should have ConfigService configured', () => {
    const configService = testModule.get(ConfigService);
    expect(configService).toBeDefined();
    expect(configService.get('DB_HOST')).toBe('localhost');
    expect(configService.get('DB_PORT')).toBe('5432');
  });

  it('should have DataSource configured', () => {
    const dataSource = testModule.get(DataSource);
    expect(dataSource).toBeDefined();
    expect(typeof dataSource.initialize).toBe('function');
    expect(typeof dataSource.createQueryRunner).toBe('function');
  });

  it('should have all feature modules imported', () => {
    expect(AuthModule).toBeCalled();
    expect(UserModule).toBeCalled();
    expect(PhotoModule).toBeCalled();
    expect(FeedModule).toBeCalled();
    expect(InteractionModule).toBeCalled();
    expect(SearchModule).toBeCalled();
    expect(NotificationModule).toBeCalled();
  });
});
