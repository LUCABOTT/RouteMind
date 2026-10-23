
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

@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
  ) {}

  @Post()
  crear(@Body() dto: CrearPedidoDto) {
    return this.pedidosService.crear(dto);
  }

  @Get()
  listar() {
    return this.pedidosService.listar();
  }

  @Get(':id')
  buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pedidosService.buscarPorId(id);
  }


@Patch(':id')
actualizar(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: ActualizarPedidoDto,
) {
  return this.pedidosService.actualizar(id, dto);
}

@Delete(':id')
eliminar(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.pedidosService.eliminar(id);
}


@Patch(':id/asignar')
asignar(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: AsignarPedidoDto,
) {
  return this.pedidosService.asignar(id, dto);
}



}
