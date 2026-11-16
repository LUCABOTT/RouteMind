
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';

import { RecorridosService } from './recorridos.service';

@Controller('recorridos')
export class RecorridosController {
  constructor(
    private readonly recorridosService: RecorridosService,
  ) {}

  @Get()
  listar() {
    return this.recorridosService.listar();
  }

  @Get(':id')
  async buscarPorId(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const recorrido =
      await this.recorridosService.buscarPorId(id);

    if (!recorrido) {
      throw new NotFoundException(
        `No existe el recorrido con ID ${id}`,
      );
    }

    return recorrido;
  }
}
