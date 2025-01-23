import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from '../../domain/entities/user.entity';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import * as bcrypt from 'bcrypt';
import '@jest/globals';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockFindOneSpy: jest.SpyInstance;
  let mockCreateSpy: jest.SpyInstance;
  let mockSaveSpy: jest.SpyInstance;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$6KqwgbN.eXH3dxZKw9Tn8eVL4Jv.rqQMaW6P3fzJqmMGF1Io4Wvwq', // hashed 'password123'
    bio: '', // Empty string since TypeScript is not properly handling nullable bio
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async (): Promise<void> => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup spies
    mockFindOneSpy = jest.spyOn(mockUserRepository, 'findOne');
    mockCreateSpy = jest.spyOn(mockUserRepository, 'create');
    mockSaveSpy = jest.spyOn(mockUserRepository, 'save');

    // Reset spy implementations
    mockFindOneSpy.mockReset();
    mockCreateSpy.mockReset();
    mockSaveSpy.mockReset();

    // Setup bcrypt mocks with default behavior
    (bcrypt.compare as jest.Mock).mockImplementation((plaintext: string) =>
      Promise.resolve(plaintext === 'password123'),
    );
    (bcrypt.hash as jest.Mock).mockImplementation(() =>
      Promise.resolve(
        '$2b$10$6KqwgbN.eXH3dxZKw9Tn8eVL4Jv.rqQMaW6P3fzJqmMGF1Io4Wvwq',
      ),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
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

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', (): void => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    // Happy path
    it('should register a new user successfully', async (): Promise<void> => {
      mockFindOneSpy.mockResolvedValueOnce(null);
      mockCreateSpy.mockReturnValueOnce(mockUser);
      mockSaveSpy.mockResolvedValueOnce(mockUser);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock.jwt.token');
      expect(mockFindOneSpy).toHaveBeenCalledWith({
        where: [
          { username: registerDto.username },
          { email: registerDto.email },
        ],
      });
      expect(mockCreateSpy).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        password: expect.any(String) as string, // hashed password
      } as Partial<User>);
      expect(mockSaveSpy).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    // Error cases
    it('should throw ConflictException if username exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        email: 'different@example.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        username: 'different',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalled();
    });

    // Edge cases
    it('should handle database error during user creation', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    // Happy path
    it('should login successfully with valid credentials', async (): Promise<void> => {
      const findOneSpy = jest.spyOn(mockUserRepository, 'findOne');
      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock.jwt.token');
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      findOneSpy.mockRestore();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    // Error cases
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ ...loginDto, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        mockUser.password,
      );
    });

    it('should handle bcrypt comparison error', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValueOnce(
        new Error('Bcrypt error'),
      );

      await expect(service.login(loginDto)).rejects.toThrow('Bcrypt error');
    });

    it('should throw UnauthorizedException if invalid password provided', async (): Promise<void> => {
      const findOneSpy = jest.spyOn(mockUserRepository, 'findOne');
      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      findOneSpy.mockRestore();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    // Edge cases
    it('should handle database error during user lookup', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.login(loginDto)).rejects.toThrow('Database error');
    });

    it('should handle empty email in login attempt', async () => {
      const emptyEmailDto = { ...loginDto, email: '' };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(emptyEmailDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
