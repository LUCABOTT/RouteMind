
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Pedido } from './models/pedido.model';
import { CrearPedidoDto } from './dto/crear-pedidos.dto';
import { ActualizarPedidoDto } from './dto/actualizar-pedido.dto';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { AsignarPedidoDto } from './dto/asignar-pedido.dto';

@Injectable()
export class PedidosService {
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

  if (pedido.estado === 'EN_CAMINO' ||
      pedido.estado === 'ENTREGADO') {
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

  const vehiculo = await this.vehiculoModel.findByPk(
    dto.vehiculoId,
  );

  if (!vehiculo) {
    throw new NotFoundException(
      'No existe el vehículo indicado',
    );
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


async planificarRuta(vehiculoId: number) {
    const vehiculo = await this.vehiculoModel.findByPk(vehiculoId);

    if (!vehiculo) {
      throw new NotFoundException(
        `No existe un vehículo con el ID ${vehiculoId}`,
      );
    }

    if (vehiculo.estado === 'MANTENIMIENTO') {
      throw new ConflictException(
        'No se puede planificar una ruta para un vehículo en mantenimiento',
      );
    }

    const pedidos = await this.pedidoModel.findAll({
      where: { vehiculoId },
    });

    const restantes = pedidos.filter(
      (pedido) =>
        pedido.estado === 'ASIGNADO' ||
        pedido.estado === 'EN_CAMINO',
    );

    const origen =
      vehiculo.latitudActual != null &&
      vehiculo.longitudActual != null
        ? {
            latitud: Number(vehiculo.latitudActual),
            longitud: Number(vehiculo.longitudActual),
          }
        : null;

    const prioridad: Record<string, number> = {
      ALTA: 3,
      MEDIA: 2,
      BAJA: 1,
    };

    let puntoActual = origen;
    let distanciaTotalKm = 0;
    const paradas: Array<{
      orden: number;
      pedidoId: number;
      destinatario: string;
      direccion: string;
      latitud: number;
      longitud: number;
      prioridad: string;
      estado: string;
      distanciaDesdeAnteriorKm: number | null;
    }> = [];

    while (restantes.length > 0) {
      let indiceElegido = 0;

      if (puntoActual) {
        let menorDistancia = Infinity;

        for (let i = 0; i < restantes.length; i++) {
          const distancia = this.distanciaKm(
            puntoActual.latitud,
            puntoActual.longitud,
            Number(restantes[i].latitud),
            Number(restantes[i].longitud),
          );

          if (distancia < menorDistancia) {
            menorDistancia = distancia;
            indiceElegido = i;
          }
        }
      } else {
        // Sin coordenadas del vehículo, comenzar por prioridad.
        restantes.sort(
          (a, b) =>
            prioridad[b.prioridad] - prioridad[a.prioridad] ||
            a.id - b.id,
        );
      }

      const [pedido] = restantes.splice(indiceElegido, 1);

      const latitud = Number(pedido.latitud);
      const longitud = Number(pedido.longitud);

      const distancia = puntoActual
        ? this.distanciaKm(
            puntoActual.latitud,
            puntoActual.longitud,
            latitud,
            longitud,
          )
        : null;

      if (distancia !== null) {
        distanciaTotalKm += distancia;
      }

      paradas.push({
        orden: paradas.length + 1,
        pedidoId: pedido.id,
        destinatario: pedido.destinatario,
        direccion: pedido.direccion,
        latitud,
        longitud,
        prioridad: pedido.prioridad,
        estado: pedido.estado,
        distanciaDesdeAnteriorKm:
          distancia === null ? null : Number(distancia.toFixed(2)),
      });

      puntoActual = { latitud, longitud };
    }

    return {
      vehiculo: {
        id: vehiculo.id,
        codigo: vehiculo.codigo,
        conductor: vehiculo.conductor,
        estado: vehiculo.estado,
      },
      origen,
      algoritmo: 'vecino_mas_cercano',
      tipoDistancia: 'linea_recta',
      totalParadas: paradas.length,
      distanciaTotalKm: Number(distanciaTotalKm.toFixed(2)),
      paradas,
      nota: origen
        ? 'Distancia aproximada en línea recta desde el vehículo y entre las paradas.'
        : 'El vehículo no tiene coordenadas actuales. La ruta comienza por el pedido de mayor prioridad; la distancia total no incluye el trayecto desde el vehículo.',
    };
  }

  private distanciaKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const radioTierraKm = 6371;
    const radianes = (grados: number) => (grados * Math.PI) / 180;

    const diferenciaLatitud = radianes(lat2 - lat1);
    const diferenciaLongitud = radianes(lon2 - lon1);

    const a =
      Math.sin(diferenciaLatitud / 2) ** 2 +
      Math.cos(radianes(lat1)) *
        Math.cos(radianes(lat2)) *
        Math.sin(diferenciaLongitud / 2) ** 2;

    return (
      2 *
      radioTierraKm *
      Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    );
  }



}
