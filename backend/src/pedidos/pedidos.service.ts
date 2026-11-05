import { Injectable } from '@nestjs/common';
import { AsignarPedidoDto } from './dto/asignar-pedido.dto';
import { ActualizarPedidoDto } from './dto/actualizar-pedido.dto';
import { CrearPedidoDto } from './dto/crear-pedidos.dto';
import { Pedido } from './models/pedido.model';
import { PedidosCrudService } from './services/pedidos-crud.service';
import { PedidosRecorridosService } from './services/pedidos-recorridos.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class PedidosService {
  constructor(
    private readonly pedidosCrudService: PedidosCrudService,
    private readonly pedidosRecorridosService: PedidosRecorridosService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async crear(dto: CrearPedidoDto): Promise<Pedido> {
    const pedido = await this.pedidosCrudService.crear(dto);
    this.publicarCambioPedido(pedido);
    return pedido;
  }

  listar(): Promise<Pedido[]> {
    return this.pedidosCrudService.listar();
  }

  buscarPorId(id: number): Promise<Pedido> {
    return this.pedidosCrudService.buscarPorId(id);
  }

  async actualizar(id: number, dto: ActualizarPedidoDto): Promise<Pedido> {
    const pedido = await this.pedidosCrudService.actualizar(id, dto);
    this.publicarCambioPedido(pedido);
    return pedido;
  }

  async marcarEntregado(id: number): Promise<Pedido> {
    const pedido = await this.pedidosRecorridosService.marcarEntregado(id);
    this.publicarCambioPedido(pedido);
    return pedido;
  }

  async iniciarRecorrido(
    vehiculoId: number,
    distanciaEstimadaKm?: number | null,
  ) {
    const recorrido = await this.pedidosRecorridosService.iniciarRecorrido(
      vehiculoId,
      distanciaEstimadaKm,
    );
    this.realtimeGateway.publishRouteUpdated({
      vehiculoId,
      recorridoId: recorrido.recorridoId,
    });
    return recorrido;
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const pedido = await this.pedidosCrudService.buscarPorId(id);
    const result = await this.pedidosCrudService.eliminar(id);
    this.publicarCambioPedido(pedido);
    return result;
  }

  async asignar(id: number, dto: AsignarPedidoDto): Promise<Pedido> {
    const pedido = await this.pedidosCrudService.asignar(id, dto);
    this.publicarCambioPedido(pedido);
    return pedido;
  }

  planificarRuta(vehiculoId: number) {
    return this.pedidosRecorridosService.planificarRuta(vehiculoId);
  }

  private publicarCambioPedido(pedido: Pedido): void {
    this.realtimeGateway.publishRouteUpdated({
      vehiculoId: pedido.vehiculoId,
      recorridoId: pedido.recorridoId,
      pedidoId: pedido.id,
    });
  }
}
