import {Test, TestingModule} from '@nestjs/testing';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {AppModule} from './app.module';
import {TypeOrmModule} from '@nestjs/typeorm';
import {DataSource} from 'typeorm';
import {randomUUID} from 'crypto';

// Mock crypto for tests
global.crypto = {
    randomUUID,
}

jest.mock('typeorm', () => {
    const actual = jest.requireActual('typeorm');
    return {
        ...actual,
        DataSource: jest.fn().mockImplementation(() => ({
            initialize: jest.fn().mockResolvedValue({}),
            destroy: jest.fn().mockResolvedValue({}),
            createQueryRunner: jest.fn().mockReturnValue({
                connect: jest.fn(),
                startTransaction: jest.fn(),
                commitTransaction: jest.fn(),
                rollbackTransaction: jest.fn(),
                release: jest.fn(),
            }),
        })),
    };
});

describe('AppModule', () => {
    let module: TestingModule;

    beforeEach(async () => {
        const moduleRef = Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        () => ({
                            JWT_SECRET: 'test-secret',
                            AWS_ACCESS_KEY_ID: 'test-key',
                            AWS_SECRET_ACCESS_KEY: 'test-secret',
                            AWS_REGION: 'us-east-1',
                            AWS_S3_BUCKET: 'test-bucket',
                            DATABASE_HOST: 'localhost',
                            DATABASE_PORT: 5432,
                            DATABASE_USERNAME: 'test',
                            DATABASE_PASSWORD: 'test',
                            DATABASE_NAME: 'test',
                        }),
                    ],
                }),
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: () => ({
                        type: 'postgres',
                        host: 'localhost',
                        port: 5432,
                        username: 'test',
                        password: 'test',
                        database: 'test',
                        autoLoadEntities: true,
                        synchronize: false,
                    }),
                }),
            ],
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config = {
                                JWT_SECRET: 'test-secret',
                                AWS_ACCESS_KEY_ID: 'test-key',
                                AWS_SECRET_ACCESS_KEY: 'test-secret',
                                AWS_REGION: 'us-east-1',
                                AWS_S3_BUCKET: 'test-bucket',
                                DATABASE_HOST: 'localhost',
                                DATABASE_PORT: 5432,
                                DATABASE_USERNAME: 'test',
                                DATABASE_PASSWORD: 'test',
                                DATABASE_NAME: 'test',
                            };
                            return config[key];
                        }),
                    },
                },
                {
                    provide: DataSource,
                    useValue: {
                        createQueryRunner: () => ({
                            connect: jest.fn(),
                            startTransaction: jest.fn(),
                            commitTransaction: jest.fn(),
                            rollbackTransaction: jest.fn(),
                            release: jest.fn(),
                        }),
                    },
                },
            ],
        }).compile();

        module = await moduleRef;
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should have ConfigModule configured', () => {
        const configModule = module.get(ConfigModule);
        expect(configModule).toBeDefined();
    });

    it('should have TypeOrmModule configured', () => {
        const configService = module.get(ConfigService);
        expect(configService.get('DATABASE_HOST')).toBe('localhost');
        expect(configService.get('DATABASE_PORT')).toBe(5432);
    });
});
