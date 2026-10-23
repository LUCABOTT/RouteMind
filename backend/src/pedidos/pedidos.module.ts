
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Pedido } from './models/pedido.model';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Pedido, Vehiculo]),
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
