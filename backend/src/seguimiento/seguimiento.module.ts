import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/models/user.model';
import { PedidosModule } from '../pedidos/pedidos.module';
import { Pedido } from '../pedidos/models/pedido.model';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { ParadaRecorrido } from './models/parada-recorrido.model';
import { UbicacionRecorrido } from './models/ubicacion-recorrido.model';
import { SeguimientoController } from './seguimiento.controller';
import { SeguimientoService } from './seguimiento.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    AuthModule,
    RealtimeModule,
    SequelizeModule.forFeature([
      User,
      Conductor,
      Vehiculo,
      Pedido,
      Recorrido,
      ParadaRecorrido,
      UbicacionRecorrido,
    ]),
    PedidosModule,
  ],
  controllers: [SeguimientoController],
  providers: [SeguimientoService],
})
export class SeguimientoModule {}
