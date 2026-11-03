import { Injectable } from '@nestjs/common';
import { AsignarPedidoDto } from './dto/asignar-pedido.dto';
import { ActualizarPedidoDto } from './dto/actualizar-pedido.dto';
import { CrearPedidoDto } from './dto/crear-pedidos.dto';
import { Pedido } from './models/pedido.model';
import { PedidosCrudService } from './services/pedidos-crud.service';
import { PedidosRecorridosService } from './services/pedidos-recorridos.service';

@Injectable()
export class PedidosService {
  constructor(
    private readonly pedidosCrudService: PedidosCrudService,
    private readonly pedidosRecorridosService: PedidosRecorridosService,
  ) {}

  crear(dto: CrearPedidoDto): Promise<Pedido> {
    return this.pedidosCrudService.crear(dto);
  }

  listar(): Promise<Pedido[]> {
    return this.pedidosCrudService.listar();
  }

  buscarPorId(id: number): Promise<Pedido> {
    return this.pedidosCrudService.buscarPorId(id);
  }

  actualizar(id: number, dto: ActualizarPedidoDto): Promise<Pedido> {
    return this.pedidosCrudService.actualizar(id, dto);
  }

  marcarEntregado(id: number): Promise<Pedido> {
    return this.pedidosRecorridosService.marcarEntregado(id);
  }

  iniciarRecorrido(
    vehiculoId: number,
    distanciaEstimadaKm?: number | null,
  ) {
    return this.pedidosRecorridosService.iniciarRecorrido(
      vehiculoId,
      distanciaEstimadaKm,
    );
  }

  eliminar(id: number): Promise<{ mensaje: string }> {
    return this.pedidosCrudService.eliminar(id);
  }

  asignar(id: number, dto: AsignarPedidoDto): Promise<Pedido> {
    return this.pedidosCrudService.asignar(id, dto);
  }

  planificarRuta(vehiculoId: number) {
    return this.pedidosRecorridosService.planificarRuta(vehiculoId);
  }
}
