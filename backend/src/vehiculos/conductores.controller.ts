import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/roles';
import { ActualizarConductorDto, CrearConductorDto } from './dto/crear-conductor.dto';
import { ConductoresService } from './conductores.service';
import { CrearCuentaConductorDto } from './dto/crear-cuenta-conductor.dto';

@Controller('conductores')
export class ConductoresController {
  constructor(private readonly conductoresService: ConductoresService) {}

  @Get()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  listar() {
    return this.conductoresService.listar();
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.conductoresService.buscarPorId(id);
  }

  @Post(':id/cuenta')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  crearCuenta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearCuentaConductorDto,
  ) {
    return this.conductoresService.crearCuenta(
      id,
      dto.email,
      dto.password,
    );
  }

  @Post()
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  crear(@Body() dto: CrearConductorDto) {
    return this.conductoresService.crear(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarConductorDto,
  ) {
    return this.conductoresService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.conductoresService.eliminar(id);
  }
}
