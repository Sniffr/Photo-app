import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard, IS_PUBLIC_KEY } from './jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import '@jest/globals';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;
    const mockHandler = jest.fn();
    const mockClass = jest.fn();

    beforeEach(() => {
      mockContext = {
        getHandler: () => mockHandler,
        getClass: () => mockClass,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer mock.jwt.token',
            },
          }),
        }),
      } as unknown as ExecutionContext;
    });

    it('should allow access when route is public', async (): Promise<void> => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
      getAllAndOverrideSpy.mockRestore();
    });

    it('should delegate to super.canActivate when route is not public', async (): Promise<void> => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      const superCanActivate = jest.spyOn(
        AuthGuard('jwt').prototype,
        'canActivate',
      );
      superCanActivate.mockImplementation(() => true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
      getAllAndOverrideSpy.mockRestore();
      expect(superCanActivate).toHaveBeenCalledWith(mockContext);

      superCanActivate.mockRestore();
    });

    it('should handle unauthorized access attempts', async (): Promise<void> => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      // Create a new instance of AuthGuard and spy on its canActivate method
      const authGuardInstance = new (AuthGuard('jwt'))();
      const canActivateSpy = jest
        .spyOn(authGuardInstance, 'canActivate')
        .mockRejectedValue(new UnauthorizedException());

      // Replace the prototype of our guard instance
      Object.setPrototypeOf(guard, authGuardInstance);

      // Test that the guard throws UnauthorizedException
      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify the spy was called
      expect(canActivateSpy).toHaveBeenCalledWith(mockContext);

      // Clean up
      canActivateSpy.mockRestore();
    });

    it('should properly check metadata using reflector', async (): Promise<void> => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      await guard.canActivate(mockContext);

      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride');
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockHandler,
        mockClass,
      ]);
      getAllAndOverrideSpy.mockRestore();
    });
  });
});
