import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Pedido } from '../models/pedido.model';
import { Recorrido } from '../../recorridos/models/recorrido.model';
import { Conductor } from '../../vehiculos/models/conductor.model';
import { Vehiculo } from '../../vehiculos/models/vehiculo.model';

@Injectable()
export class PedidosRecorridosService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    @InjectModel(Pedido)
    private readonly pedidoModel: typeof Pedido,
    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,
    @InjectModel(Recorrido)
    private readonly recorridoModel: typeof Recorrido,
  ) {}

  async marcarEntregado(id: number): Promise<Pedido> {
    return this.sequelize.transaction(async (transaction) => {
      const pedido = await this.pedidoModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pedido) {
        throw new NotFoundException(
          `No existe un pedido con el ID ${id}`,
        );
      }

      if (pedido.estado !== 'ASIGNADO' && pedido.estado !== 'EN_CAMINO') {
        throw new ConflictException(
          'Solo se pueden entregar pedidos asignados o en camino',
        );
      }

      await pedido.update(
        { estado: 'ENTREGADO' },
        { transaction },
      );

      if (pedido.recorridoId != null) {
        const recorrido = await this.recorridoModel.findByPk(
          pedido.recorridoId,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

        if (recorrido && recorrido.estado === 'EN_CURSO') {
          const pendientes = await this.pedidoModel.count({
            where: {
              recorridoId: pedido.recorridoId,
              estado: ['ASIGNADO', 'EN_CAMINO'],
            },
            transaction,
          });

          if (pendientes === 0) {
            await recorrido.update(
              {
                estado: 'COMPLETADO',
                fechaFin: new Date(),
              },
              { transaction },
            );

            const vehiculo = await this.vehiculoModel.findByPk(
              recorrido.vehiculoId,
              {
                transaction,
                lock: transaction.LOCK.UPDATE,
              },
            );

            if (vehiculo?.estado === 'EN_RUTA') {
              await vehiculo.update(
                { estado: 'DISPONIBLE' },
                { transaction },
              );
            }
          }
        }
      } else if (pedido.vehiculoId != null) {
        const vehiculo = await this.vehiculoModel.findByPk(
          pedido.vehiculoId,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

        const pendientes = await this.pedidoModel.count({
          where: {
            vehiculoId: pedido.vehiculoId,
            estado: ['ASIGNADO', 'EN_CAMINO'],
          },
          transaction,
        });

        if (pendientes === 0 && vehiculo?.estado === 'EN_RUTA') {
          await vehiculo.update(
            { estado: 'DISPONIBLE' },
            { transaction },
          );
        }
      }

      return pedido;
    });
  }

  async iniciarRecorrido(
    vehiculoId: number,
    distanciaEstimadaKm?: number | null,
  ) {
    if (
      distanciaEstimadaKm != null &&
      (typeof distanciaEstimadaKm !== 'number' ||
        !Number.isFinite(distanciaEstimadaKm) ||
        distanciaEstimadaKm < 0)
    ) {
      throw new BadRequestException(
        'La distancia estimada debe ser un número mayor o igual a cero',
      );
    }

    return this.sequelize.transaction(async (transaction) => {
      const vehiculo = await this.vehiculoModel.findByPk(vehiculoId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!vehiculo) {
        throw new NotFoundException(
          `No existe un vehículo con el ID ${vehiculoId}`,
        );
      }

      const recorridoActivo = await this.recorridoModel.findOne({
        where: {
          vehiculoId: vehiculo.id,
          estado: 'EN_CURSO',
        },
        transaction,
      });

      if (recorridoActivo) {
        throw new ConflictException(
          'El vehículo ya tiene un recorrido en curso',
        );
      }

      if (vehiculo.estado !== 'DISPONIBLE') {
        throw new ConflictException(
          'El vehículo debe estar disponible para iniciar un recorrido',
        );
      }

      const pedidosAsignados = await this.pedidoModel.findAll({
        where: {
          vehiculoId: vehiculo.id,
          estado: 'ASIGNADO',
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (pedidosAsignados.length === 0) {
        throw new ConflictException(
          'No hay pedidos asignados para iniciar el recorrido',
        );
      }

      const recorrido = await this.recorridoModel.create(
        {
          vehiculoId: vehiculo.id,
          fechaInicio: new Date(),
          fechaFin: null,
          distanciaTotalKm: distanciaEstimadaKm ?? 0,
          distanciaEstimadaKm: distanciaEstimadaKm ?? null,
          distanciaRealKm: null,
          totalPedidos: pedidosAsignados.length,
          estado: 'EN_CURSO',
        },
        { transaction },
      );

      for (const pedido of pedidosAsignados) {
        await pedido.update(
          {
            estado: 'EN_CAMINO',
            recorridoId: recorrido.id,
          },
          { transaction },
        );
      }

      await vehiculo.update(
        { estado: 'EN_RUTA' },
        { transaction },
      );

      return {
        mensaje: 'Recorrido iniciado correctamente',
        recorridoId: recorrido.id,
        vehiculoId: vehiculo.id,
        codigoVehiculo: vehiculo.codigo,
        pedidosIniciados: pedidosAsignados.length,
        distanciaTotalKm: distanciaEstimadaKm ?? 0,
        distanciaEstimadaKm: distanciaEstimadaKm ?? null,
        distanciaRealKm: null,
        pedidos: pedidosAsignados,
      };
    });
  }

  async planificarRuta(vehiculoId: number) {
    const vehiculo = await this.vehiculoModel.findByPk(vehiculoId, {
      include: [{ model: Conductor, as: 'conductorInfo' }],
    });

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
        pedido.estado === 'ASIGNADO' || pedido.estado === 'EN_CAMINO',
    );
    const origen =
      vehiculo.latitudActual != null && vehiculo.longitudActual != null
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
        conductor: vehiculo.conductorInfo?.nombre ?? null,
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
