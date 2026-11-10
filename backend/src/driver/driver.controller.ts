import {
  Controller,
  Get,
  Req,
  UseGuards,
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

  @Get('me')
  obtenerMiPerfil(@Req() request: AuthenticatedRequest) {
    return this.driverService.obtenerMiPerfil(
      request.user!.id,
      request.user!.conductorId!,
    );
  }

  @Get('routes/today')
  obtenerRecorridosDelDia(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.driverService.obtenerRecorridosDelDia(
      request.user!.conductorId!,
    );
  }

  @Get('deliveries')
  obtenerEntregas(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.driverService.obtenerEntregas(
      request.user!.conductorId!,
    );
  }
}