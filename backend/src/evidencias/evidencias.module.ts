
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { EvidenciaEntrega } from './models/evidencia-entrega.model';
import { Pedido } from '../pedidos/models/pedido.model';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { ParadaRecorrido } from '../seguimiento/models/parada-recorrido.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';

import { StorageModule } from '../storage/storage.module';
import { EvidenciasController } from './evidencias.controller';
import { EvidenciasService } from './evidencias.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      EvidenciaEntrega,
      Pedido,
      Recorrido,
      ParadaRecorrido,
      Conductor,
      Vehiculo,
    ]),
    StorageModule,
  ],
  controllers: [EvidenciasController],
  providers: [EvidenciasService],
  exports: [EvidenciasService],
})
export class EvidenciasModule {}
