import { Test, TestingModule } from '@nestjs/testing';
// Removed unused import
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import '@jest/globals';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      access_token: 'mock.jwt.token',
    };

    it('should register a new user and return access token', async (): Promise<void> => {
      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      const registerSpy = jest.spyOn(authService, 'register');
      expect(result).toBe(mockResponse);
      expect(registerSpy).toHaveBeenCalledWith(registerDto);
      registerSpy.mockRestore();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      access_token: 'mock.jwt.token',
    };

    it('should login user and return access token', async (): Promise<void> => {
      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      const loginSpy = jest.spyOn(authService, 'login');
      expect(result).toBe(mockResponse);
      expect(loginSpy).toHaveBeenCalledWith(loginDto);
      loginSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      const result = controller.logout();

      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });
});
