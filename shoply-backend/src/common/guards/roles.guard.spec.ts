import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function mockExecutionContext(userRole?: string): ExecutionContext {
  return {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: userRole ? { role: userRole } : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  describe('canActivate', () => {
    it('should return true when no roles metadata is set', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = mockExecutionContext('user');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should return true when user role matches required roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = mockExecutionContext('admin');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should throw ForbiddenException when user role does not match', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = mockExecutionContext('user');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user is undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = mockExecutionContext(); // no user
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
