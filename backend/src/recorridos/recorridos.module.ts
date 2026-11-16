
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { RecorridosController } from './recorridos.controller';
import { RecorridosService } from './recorridos.service';
import { Recorrido } from './models/recorrido.model';
import { Pedido } from '../pedidos/models/pedido.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { ParadaRecorrido } from '../seguimiento/models/parada-recorrido.model';
import { UbicacionRecorrido } from '../seguimiento/models/ubicacion-recorrido.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Recorrido,
      Pedido,
      Vehiculo,
      ParadaRecorrido,
      UbicacionRecorrido,
    ]),
  ],
  controllers: [RecorridosController],
  providers: [RecorridosService],
  exports: [RecorridosService],
})
export class RecorridosModule {}
