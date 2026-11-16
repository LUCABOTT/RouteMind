import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';

import { User } from '../auth/models/user.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { Pedido } from '../pedidos/models/pedido.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Conductor,
      Vehiculo,
      Recorrido,
      Pedido,
    ]),
  ],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}