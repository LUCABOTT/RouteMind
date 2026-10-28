
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Pedido } from './models/pedido.model';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PedidosCrudService } from './services/pedidos-crud.service';
import { PedidosRecorridosService } from './services/pedidos-recorridos.service';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { Recorrido } from '../recorridos/models/recorrido.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Pedido, Vehiculo, Recorrido]),
  ],
  controllers: [PedidosController],
  providers: [
    PedidosService,
    PedidosCrudService,
    PedidosRecorridosService,
  ],
  exports: [PedidosService],
})
export class PedidosModule {}
