import { jest } from '@jest/globals';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../auth/roles';
import { SeguimientoController } from './seguimiento.controller';
import { SeguimientoService } from './seguimiento.service';

describe('SeguimientoController OwnTracks', () => {
  const seguimientoService = {
    registrarUbicacion: jest.fn(),
  };
  const authService = {
    validarCredenciales: jest.fn(),
  };
  const controller = new SeguimientoController(
    seguimientoService as unknown as SeguimientoService,
    authService as unknown as AuthService,
  );
  const authorization = `Basic ${Buffer.from(
    'driver@example.com:password',
  ).toString('base64')}`;

  const request = (authorizationHeader?: string) =>
    ({
      headers: { authorization: authorizationHeader },
    }) as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    authService.validarCredenciales.mockResolvedValue({
      id: 7,
      role: UserRole.CONDUCTOR,
      conductorId: 3,
    });
    seguimientoService.registrarUbicacion.mockResolvedValue({
      recibido: true,
    });
  });

  it('authenticates the driver and records OwnTracks location data', async () => {
    await expect(
      controller.ownTracks(request(authorization), 12, {
        _type: 'location',
        lat: 14.0723,
        lon: -87.1921,
        acc: 8,
      }),
    ).resolves.toEqual([]);

    expect(authService.validarCredenciales).toHaveBeenCalledWith(
      'driver@example.com',
      'password',
    );
    expect(seguimientoService.registrarUbicacion).toHaveBeenCalledWith(7, {
      vehiculoId: 12,
      latitud: 14.0723,
      longitud: -87.1921,
      accuracy: 8,
    });
  });

  it('ignores non-location OwnTracks messages', async () => {
    await expect(
      controller.ownTracks(request(authorization), 12, {
        _type: 'transition',
      }),
    ).resolves.toEqual([]);

    expect(seguimientoService.registrarUbicacion).not.toHaveBeenCalled();
  });

  it('rejects invalid coordinates', async () => {
    await expect(
      controller.ownTracks(request(authorization), 12, {
        _type: 'location',
        lat: 91,
        lon: -87,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires HTTP Basic credentials', async () => {
    await expect(
      controller.ownTracks(request(), 12, {
        _type: 'location',
        lat: 14,
        lon: -87,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
