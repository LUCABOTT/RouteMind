
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Vehiculo } from './models/vehiculo.model';
import { VehiculosController } from './vehiculos.controller';
import { VehiculosService } from './vehiculos.service';
import { Conductor } from './models/conductor.model';
import { ConductoresController } from './conductores.controller';
import { ConductoresService } from './conductores.service';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { User } from '../auth/models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([Vehiculo, Conductor, Recorrido, User])],
  controllers: [VehiculosController, ConductoresController],
  providers: [VehiculosService, ConductoresService],
  exports: [VehiculosService, ConductoresService],
})
export class VehiculosModule {}
