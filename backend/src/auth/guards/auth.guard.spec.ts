import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { User } from '../models/user.model';
import { UserRole } from '../roles';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';

describe('AuthGuard', () => {
  const reflector = new Reflector();
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;
  const userModel = {
    findByPk: jest.fn(),
  } as unknown as typeof User;
  const guard = new AuthGuard(reflector, jwtService, userModel);

  function createContext(request: Partial<AuthenticatedRequest>) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(false);
  });

  it('loads the active user and current role from the database', async () => {
    jwtService.verifyAsync = jest.fn().mockResolvedValue({ sub: 42 });
    userModel.findByPk = jest.fn().mockResolvedValue({
      id: 42,
      email: 'planner@example.com',
      name: 'Planner',
      role: UserRole.VIEWER,
      active: true,
    });
    const request: Partial<AuthenticatedRequest> = {
      cookies: { routeMindToken: 'session-token' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toMatchObject({
      id: 42,
      role: UserRole.VIEWER,
    });
  });

  it('rejects requests without a session cookie', async () => {
    await expect(
      guard.canActivate(createContext({})),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects users whose accounts are inactive', async () => {
    jwtService.verifyAsync = jest.fn().mockResolvedValue({ sub: 42 });
    userModel.findByPk = jest.fn().mockResolvedValue({ active: false });
    const request: Partial<AuthenticatedRequest> = {
      cookies: { routeMindToken: 'session-token' },
    };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
