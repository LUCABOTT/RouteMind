import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AsignarPedidoDto } from '../dto/asignar-pedido.dto';
import { ActualizarPedidoDto } from '../dto/actualizar-pedido.dto';
import { CrearPedidoDto } from '../dto/crear-pedidos.dto';
import { Pedido } from '../models/pedido.model';
import { Vehiculo } from '../../vehiculos/models/vehiculo.model';

@Injectable()
export class PedidosCrudService {
  constructor(
    @InjectModel(Pedido)
    private readonly pedidoModel: typeof Pedido,
    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,
  ) {}

  async crear(dto: CrearPedidoDto): Promise<Pedido> {
    return this.pedidoModel.create({
      destinatario: dto.destinatario,
      direccion: dto.direccion,
      latitud: dto.latitud,
      longitud: dto.longitud,
      prioridad: dto.prioridad ?? 'MEDIA',
      estado: 'PENDIENTE',
      observaciones: dto.observaciones ?? null,
    });
  }

  async listar(): Promise<Pedido[]> {
    return this.pedidoModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async buscarPorId(id: number): Promise<Pedido> {
    const pedido = await this.pedidoModel.findByPk(id);

    if (!pedido) {
      throw new NotFoundException(
        `No existe un pedido con el ID ${id}`,
      );
    }

    return pedido;
  }

  async actualizar(
    id: number,
    dto: ActualizarPedidoDto,
  ): Promise<Pedido> {
    const pedido = await this.buscarPorId(id);

    if (pedido.estado === 'ENTREGADO') {
      throw new NotFoundException(
        'No se puede modificar un pedido ya entregado',
      );
    }

    await pedido.update(dto);
    return pedido;
  }

  async eliminar(id: number): Promise<{ mensaje: string }> {
    const pedido = await this.buscarPorId(id);

    if (pedido.estado === 'EN_CAMINO' || pedido.estado === 'ENTREGADO') {
      throw new NotFoundException(
        'No se puede eliminar un pedido en camino o ya entregado',
      );
    }

    await pedido.destroy();
    return { mensaje: 'Pedido eliminado correctamente' };
  }

  async asignar(
    id: number,
    dto: AsignarPedidoDto,
  ): Promise<Pedido> {
    const pedido = await this.buscarPorId(id);

    if (pedido.estado !== 'PENDIENTE') {
      throw new ConflictException(
        'Solo se pueden asignar pedidos pendientes',
      );
    }

    const vehiculo = await this.vehiculoModel.findByPk(dto.vehiculoId);

    if (!vehiculo) {
      throw new NotFoundException('No existe el vehículo indicado');
    }

    if (vehiculo.estado !== 'DISPONIBLE') {
      throw new ConflictException(
        'El vehículo no está disponible para planificar una ruta',
      );
    }

    const pedidosAsignados = await this.pedidoModel.count({
      where: {
        vehiculoId: vehiculo.id,
        estado: 'ASIGNADO',
      },
    });

    if (pedidosAsignados >= vehiculo.capacidad) {
      throw new BadRequestException(
        'El vehículo no tiene capacidad disponible',
      );
    }

    await pedido.update({
      vehiculoId: vehiculo.id,
      estado: 'ASIGNADO',
    });

    return pedido;
  }
}
