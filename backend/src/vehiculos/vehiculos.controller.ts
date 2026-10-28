
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete,
} from '@nestjs/common';

import { VehiculosService } from './vehiculos.service';
import { CrearVehiculoDto } from './dto/crear-vehiculos.dto';
import { ActualizarVehiculoDto } from './dto/actualizar-vehiculo.dto';
import { CambiarEstadoVehiculoDto } from './dto/cambiar-estado-vehiculo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('vehiculos')
export class VehiculosController {
  constructor(
    private readonly vehiculosService: VehiculosService,
  ) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  crear(@Body() dto: CrearVehiculoDto) {
    return this.vehiculosService.crear(dto);
  }

  @Get()
  listar() {
    return this.vehiculosService.listar();
  }

  @Get(':id')
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.vehiculosService.buscarPorId(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarVehiculoDto,
  ) {
    return this.vehiculosService.actualizar(id, dto);
  }

  @Patch(':id/estado')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoVehiculoDto,
  ) {
    return this.vehiculosService.cambiarEstado(id, dto.estado);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.vehiculosService.eliminar(id);
  }
}
