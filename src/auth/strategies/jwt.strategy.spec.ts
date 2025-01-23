import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../domain/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import '@jest/globals';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<User>;
  const mockUser: Partial<User> = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const findOneMock = jest.fn();
  const mockUserRepository = {
    findOne: findOneMock,
  } as unknown as Repository<User>;

  beforeEach(() => {
    findOneMock.mockReset();
    findOneMock.mockResolvedValue(null);
  });

  // Create a minimal mock that satisfies JwtStrategy's requirements
  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Ensure JWT_SECRET is available
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-jwt-secret';
      }
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        JwtStrategy,
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get(getRepositoryToken(User));
  });

  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get(getRepositoryToken(User));

    // Ensure JWT_SECRET is available for the strategy
    mockConfigService.get.mockReturnValue('test-jwt-secret');
    // ConfigService is mocked, no need to get from module

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', (): void => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const payload: JwtPayload = {
      sub: '1',
      email: 'test@example.com',
      username: 'testuser',
    };

    it('should validate and return user when user exists', async (): Promise<void> => {
      findOneMock.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      const findOneSpy = jest.spyOn(userRepository, 'findOne');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
      findOneSpy.mockRestore();
    });

    it('should throw UnauthorizedException when user not found', async (): Promise<void> => {
      findOneMock.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      const findOneSpy = jest.spyOn(userRepository, 'findOne');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
      findOneSpy.mockRestore();
    });

    it('should throw UnauthorizedException when payload is invalid', async (): Promise<void> => {
      const invalidPayload = { sub: null, email: null, username: null };
      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      const findOneSpy = jest.spyOn(userRepository, 'findOne');
      expect(findOneSpy).not.toHaveBeenCalled();
      findOneSpy.mockRestore();
    });

    it('should handle database errors gracefully', async (): Promise<void> => {
      findOneMock.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database error',
      );
      const findOneSpy = jest.spyOn(userRepository, 'findOne');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
      findOneSpy.mockRestore();
    });

    it('should verify JWT_SECRET is properly injected', (): void => {
      jest.clearAllMocks();

      // Create a new instance to verify constructor behavior
      const getSpy = jest.spyOn(mockConfigService, 'get');
      const strategy = new JwtStrategy(
        mockConfigService as unknown as ConfigService,
        mockUserRepository,
      );

      expect(getSpy).toHaveBeenCalledWith('JWT_SECRET');
      expect(getSpy).toHaveReturnedWith('test-jwt-secret');
      getSpy.mockRestore();
    });

    it('should throw UnauthorizedException for invalid payload', async () => {
      const invalidPayload = { sub: '', email: '' } as JwtPayload;
      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      const findOneSpy = jest.spyOn(mockUserRepository, 'findOne');
      expect(findOneSpy).not.toHaveBeenCalled();
      findOneSpy.mockRestore();
    });

    it('should throw UnauthorizedException for missing payload properties', async () => {
      const invalidPayload = {} as JwtPayload;
      await expect(strategy.validate(invalidPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      const findOneSpy = jest.spyOn(mockUserRepository, 'findOne');
      expect(findOneSpy).not.toHaveBeenCalled();
      findOneSpy.mockRestore();
    });

    it('should throw UnauthorizedException for null payload', async () => {
      const findOneSpy = jest.spyOn(mockUserRepository, 'findOne');

      await expect(
        strategy.validate(null as unknown as JwtPayload),
      ).rejects.toThrow(UnauthorizedException);
      expect(findOneSpy).not.toHaveBeenCalled();
      findOneSpy.mockRestore();
    });

    it('should handle database error during user lookup', async () => {
      const findOneSpy = jest.spyOn(mockUserRepository, 'findOne');
      findOneSpy.mockRejectedValueOnce(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(
        'Database error',
      );
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
      findOneSpy.mockRestore();
    });
  });
});
