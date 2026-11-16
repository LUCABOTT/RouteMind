
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

import { PedidosService } from './pedidos.service';
import { CrearPedidoDto } from './dto/crear-pedidos.dto';
import { ActualizarPedidoDto } from './dto/actualizar-pedido.dto';
import { AsignarPedidoDto } from './dto/asignar-pedido.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
  ) {}

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR)
  crear(@Body() dto: CrearPedidoDto) {
    return this.pedidosService.crear(dto);
  }

  @Get()
  listar() {
    return this.pedidosService.listar();
  }


@Patch('vehiculo/:vehiculoId/iniciar')
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR)
iniciarRecorrido(
  @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
  @Body()
  body: {
    distanciaEstimadaKm?: number | null;
    distanciaTotalKm?: number | null;
  },
) {
  const distanciaEstimadaKm =
    body?.distanciaEstimadaKm !== undefined
      ? body.distanciaEstimadaKm
      : body?.distanciaTotalKm;

  return this.pedidosService.iniciarRecorrido(
    vehiculoId,
    distanciaEstimadaKm,
  );
}



@Patch(':id/entregar')
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR)
marcarEntregado(@Param('id', ParseIntPipe) id: number) {
  return this.pedidosService.marcarEntregado(id);
}


  @Get(':id')
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pedidosService.buscarPorId(id);
  }


@Patch(':id')
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR)
actualizar(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: ActualizarPedidoDto,
) {
  return this.pedidosService.actualizar(id, dto);
}

@Delete(':id')
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR)
eliminar(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.pedidosService.eliminar(id);
}

@Get('vehiculo/:vehiculoId/planificar')
  planificarRuta(
    @Param('vehiculoId', ParseIntPipe) vehiculoId: number,
  ) {
    return this.pedidosService.planificarRuta(vehiculoId);
  }


@Patch(':id/asignar')
@Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR)
asignar(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: AsignarPedidoDto,
) {
  return this.pedidosService.asignar(id, dto);
}



}
