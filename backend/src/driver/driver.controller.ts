
import {
  Controller,
  Get,
  Req,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { DriverService } from './driver.service';

import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';

@Controller('driver')
@Roles(UserRole.CONDUCTOR)
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
  ) {}

  /**
   * GET /api/driver/me
   */
  @Get('me')
  obtenerMiPerfil(@Req() request: AuthenticatedRequest) {
    return this.driverService.obtenerMiPerfil(
      request.user!.id,
      request.user!.conductorId!,
    );
  }

  /**
   * GET /api/driver/routes/today
   */
  @Get('routes/today')
  obtenerRecorridosDelDia(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.driverService.obtenerRecorridosDelDia(
      request.user!.conductorId!,
    );
  }

  /**
   * GET /api/driver/deliveries
   */
  @Get('deliveries')
  obtenerEntregas(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.driverService.obtenerEntregas(
      request.user!.conductorId!,
    );
  }

  /**
   * GET /api/driver/deliveries/:id
   */
  @Get('deliveries/:id')
  obtenerDetalleEntrega(
    @Param('id', ParseIntPipe) pedidoId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.driverService.obtenerDetalleEntrega(
      pedidoId,
      request.user!.conductorId!,
    );
  }
}
