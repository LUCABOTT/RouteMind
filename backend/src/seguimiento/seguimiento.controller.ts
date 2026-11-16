import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';
import { UbicacionDto } from './dto/ubicacion.dto';
import { SeguimientoService } from './seguimiento.service';

@Controller('seguimiento')
export class SeguimientoController {
  constructor(
    private readonly seguimientoService: SeguimientoService,
    private readonly authService: AuthService,
  ) {}

  @Get('mis-vehiculos')
  @Roles(UserRole.CONDUCTOR)
  misVehiculos(@Req() request: AuthenticatedRequest) {
    return this.seguimientoService.misVehiculos(request.user!.id);
  }

  @Post('iniciar')
  @Roles(UserRole.CONDUCTOR)
  iniciar(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UbicacionDto,
  ) {
    return this.seguimientoService.iniciarRecorrido(request.user!.id, dto);
  }

  @Post('ubicacion')
  @Roles(UserRole.CONDUCTOR)
  ubicacion(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UbicacionDto,
  ) {
    return this.seguimientoService.registrarUbicacion(request.user!.id, dto);
  }

  @Post('owntracks/:vehiculoId')
  @Public()
  @HttpCode(HttpStatus.OK)
  async ownTracks(
    @Req() request: AuthenticatedRequest,
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Body() payload: Record<string, unknown>,
  ) {
    const credentials = this.leerCredencialesBasicas(
      request.headers.authorization,
    );
    const user = await this.authService.validarCredenciales(
      credentials.username,
      credentials.password,
    );
    if (user.role !== UserRole.CONDUCTOR || user.conductorId == null) {
      throw new UnauthorizedException('Se requiere una cuenta de conductor');
    }

    if (!payload || payload._type !== 'location') return [];

    const latitud = payload.lat;
    const longitud = payload.lon;
    const accuracy = payload.acc;
    if (
      typeof latitud !== 'number' ||
      !Number.isFinite(latitud) ||
      latitud < -90 ||
      latitud > 90 ||
      typeof longitud !== 'number' ||
      !Number.isFinite(longitud) ||
      longitud < -180 ||
      longitud > 180 ||
      (accuracy !== undefined &&
        (typeof accuracy !== 'number' ||
          !Number.isFinite(accuracy) ||
          accuracy < 0))
    ) {
      throw new BadRequestException(
        'La ubicación de OwnTracks contiene coordenadas inválidas',
      );
    }

    await this.seguimientoService.registrarUbicacion(user.id, {
      vehiculoId,
      latitud,
      longitud,
      ...(typeof accuracy === 'number' ? { accuracy } : {}),
    });
    return [];
  }

  @Patch('vehiculos/:vehiculoId/pedidos/:pedidoId/entregar')
  @Roles(UserRole.CONDUCTOR)
  entregar(
    @Req() request: AuthenticatedRequest,
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
    @Param('pedidoId', ParseIntPipe) pedidoId: number,
  ) {
    return this.seguimientoService.entregarPedido(
      request.user!.id,
      vehiculoId,
      pedidoId,
    );
  }

  @Get('vehiculos/:vehiculoId')
  @Roles(
    UserRole.SUPERADMIN,
    UserRole.ADMIN,
    UserRole.PLANIFICADOR,
    UserRole.VIEWER,
  )
  seguimientoVehiculo(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
  ) {
    return this.seguimientoService.seguimientoVehiculo(vehiculoId);
  }

  private leerCredencialesBasicas(
    authorization: string | undefined,
  ): { username: string; password: string } {
    const match = /^Basic\s+([A-Za-z0-9+/]+={0,2})$/i.exec(
      authorization ?? '',
    );
    if (!match) {
      throw new UnauthorizedException(
        'OwnTracks debe autenticarse con HTTP Basic',
      );
    }

    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 1) {
      throw new UnauthorizedException('Credenciales de OwnTracks inválidas');
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  }
}
