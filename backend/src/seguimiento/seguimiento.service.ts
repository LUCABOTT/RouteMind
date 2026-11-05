import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectConnection } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { User } from '../auth/models/user.model';
import { Pedido } from '../pedidos/models/pedido.model';
import { PedidosService } from '../pedidos/pedidos.service';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { ParadaRecorrido } from './models/parada-recorrido.model';
import { UbicacionRecorrido } from './models/ubicacion-recorrido.model';
import { UbicacionDto } from './dto/ubicacion.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const STOP_RADIUS_KM = 0.1;
const STOP_MINIMUM_SECONDS = 5 * 60;
const MAX_STOP_SAMPLE_GAP_SECONDS = 2 * 60;
const MAX_MOVEMENT_INTERVAL_SECONDS = 5 * 60;

@Injectable()
export class SeguimientoService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Conductor)
    private readonly conductorModel: typeof Conductor,
    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,
    @InjectModel(Pedido)
    private readonly pedidoModel: typeof Pedido,
    @InjectModel(Recorrido)
    private readonly recorridoModel: typeof Recorrido,
    @InjectModel(ParadaRecorrido)
    private readonly paradaModel: typeof ParadaRecorrido,
    @InjectModel(UbicacionRecorrido)
    private readonly ubicacionModel: typeof UbicacionRecorrido,
    private readonly pedidosService: PedidosService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async misVehiculos(userId: number) {
    const conductor = await this.obtenerConductor(userId);
    const vehicles = await this.vehiculoModel.findAll({
      where: { conductorId: conductor.id },
      order: [['codigo', 'ASC']],
    });

    return Promise.all(
      vehicles.map(async (vehicle) => {
        const recorridoActivo = await this.recorridoActivo(vehicle.id);
        const recorrido =
          recorridoActivo ?? (await this.recorridoMasReciente(vehicle.id));
        const pedidosAsignados = await this.pedidoModel.findAll({
          where: { vehiculoId: vehicle.id, estado: 'ASIGNADO' },
          order: [['id', 'ASC']],
        });
        const pedidos =
          recorridoActivo || pedidosAsignados.length === 0
            ? recorrido
              ? await this.pedidoModel.findAll({
                  where: { recorridoId: recorrido.id },
                  order: [['id', 'ASC']],
                })
              : []
            : pedidosAsignados;
        const paradas = recorrido
          ? await this.listarParadas(recorrido.id)
          : [];

        return {
          id: vehicle.id,
          codigo: vehicle.codigo,
          estado: vehicle.estado,
          recorridoId: recorrido?.id ?? null,
          recorridoEstado: recorrido?.estado ?? null,
          pedidos: pedidos.map((pedido) => this.serializarPedido(pedido)),
          paradas,
        };
      }),
    );
  }

  async iniciarRecorrido(userId: number, location: UbicacionDto) {
    const vehicle = await this.vehiculoAsignado(userId, location.vehiculoId);
    const registradoEn = new Date();
    await this.guardarUbicacion(vehicle, location, undefined, registradoEn);
    const result = await this.pedidosService.iniciarRecorrido(vehicle.id);
    await this.ubicacionModel.create({
      recorridoId: result.recorridoId,
      latitud: location.latitud,
      longitud: location.longitud,
      precisionM: location.accuracy ?? null,
      registradoEn,
    });
    this.realtimeGateway.publishLocationUpdated({
      vehiculoId: vehicle.id,
      recorridoId: result.recorridoId,
      registradoEn,
    });
    return result;
  }

  async registrarUbicacion(userId: number, location: UbicacionDto) {
    const result = await this.sequelize.transaction(async (transaction) => {
      const vehicle = await this.vehiculoAsignado(
        userId,
        location.vehiculoId,
        transaction,
      );
      const recorrido = await this.recorridoActivo(vehicle.id, transaction);
      if (!recorrido) {
        throw new ConflictException('El vehículo no tiene un recorrido activo');
      }

      const registradoEn = new Date();
      const previousPosition = await this.ubicacionModel.findOne({
        where: {
          recorridoId: recorrido.id,
          [Op.or]: [
            { precisionM: null },
            { precisionM: { [Op.lte]: 100 } },
          ],
        },
        order: [['registradoEn', 'DESC']],
        transaction,
      });
      await this.ubicacionModel.create(
        {
          recorridoId: recorrido.id,
          latitud: location.latitud,
          longitud: location.longitud,
          precisionM: location.accuracy ?? null,
          registradoEn,
        },
        { transaction },
      );
      await this.guardarUbicacion(vehicle, location, transaction, registradoEn);
      await this.acumularDistanciaReal(
        recorrido,
        previousPosition,
        location,
        registradoEn,
        transaction,
      );
      await this.actualizarParadaActual(
        recorrido.id,
        location,
        registradoEn,
        previousPosition,
        transaction,
      );
      return {
        recibido: true,
        registradoEn,
        recorridoId: recorrido.id,
      };
    });
    this.realtimeGateway.publishLocationUpdated({
      vehiculoId: location.vehiculoId,
      recorridoId: result.recorridoId,
      registradoEn: result.registradoEn,
    });
    return result;
  }

  async entregarPedido(
    userId: number,
    vehiculoId: number,
    pedidoId: number,
  ) {
    const vehicle = await this.vehiculoAsignado(userId, vehiculoId);
    const recorrido = await this.recorridoActivo(vehicle.id);
    if (!recorrido) {
      throw new ConflictException('El vehículo no tiene un recorrido activo');
    }

    const pedido = await this.pedidoModel.findOne({
      where: {
        id: pedidoId,
        recorridoId: recorrido.id,
        estado: 'EN_CAMINO',
      },
    });
    if (!pedido) {
      throw new NotFoundException(
        'El pedido no pertenece al recorrido activo de este conductor',
      );
    }

    const result = await this.pedidosService.marcarEntregado(pedidoId);
    const paradasAbiertas = await this.paradaModel.findAll({
      where: { recorridoId: recorrido.id, salidaEn: null },
    });
    const salidaEn = new Date();
    for (const parada of paradasAbiertas) {
      const duracionSegundos =
        (salidaEn.getTime() - parada.llegadaEn.getTime()) / 1000;
      if (duracionSegundos < STOP_MINIMUM_SECONDS) {
        await parada.destroy();
      } else {
        await parada.update({ salidaEn });
      }
    }
    this.realtimeGateway.publishRouteUpdated({
      vehiculoId: vehicle.id,
      recorridoId: recorrido.id,
      pedidoId,
    });
    return result;
  }

  async seguimientoVehiculo(vehiculoId: number) {
    const vehicle = await this.vehiculoModel.findByPk(vehiculoId);
    if (!vehicle) {
      throw new NotFoundException('No existe el vehículo solicitado');
    }
    const recorrido =
      (await this.recorridoActivo(vehicle.id)) ??
      (await this.recorridoMasReciente(vehicle.id));
    return {
      vehiculoId: vehicle.id,
      codigo: vehicle.codigo,
      latitud: vehicle.latitudActual,
      longitud: vehicle.longitudActual,
      actualizadoEn: vehicle.gpsUpdatedAt,
      accuracy: vehicle.gpsAccuracyM,
      recorridoId: recorrido?.id ?? null,
      recorridoEstado: recorrido?.estado ?? null,
      paradas: recorrido ? await this.listarParadas(recorrido.id) : [],
    };
  }

  private async obtenerConductor(
    userId: number,
    transaction?: Transaction,
  ): Promise<Conductor> {
    const user = await this.userModel.findByPk(userId, { transaction });
    if (!user?.conductorId) {
      throw new ConflictException(
        'Tu cuenta no está vinculada a un registro de conductor',
      );
    }
    const conductor = await this.conductorModel.findByPk(user.conductorId, {
      transaction,
    });
    if (!conductor?.activo) {
      throw new ConflictException('El registro de conductor no está activo');
    }
    return conductor;
  }

  private async vehiculoAsignado(
    userId: number,
    vehiculoId: number,
    transaction?: Transaction,
  ): Promise<Vehiculo> {
    const conductor = await this.obtenerConductor(userId, transaction);
    const vehicle = await this.vehiculoModel.findOne({
      where: { id: vehiculoId, conductorId: conductor.id },
      transaction,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
    if (!vehicle) {
      throw new NotFoundException(
        'El vehículo no está asignado a tu cuenta de conductor',
      );
    }
    return vehicle;
  }

  private async recorridoActivo(
    vehiculoId: number,
    transaction?: Transaction,
  ) {
    return this.recorridoModel.findOne({
      where: { vehiculoId, estado: 'EN_CURSO' },
      order: [['fechaInicio', 'DESC']],
      transaction,
      ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
  }

  private async recorridoMasReciente(vehiculoId: number) {
    return this.recorridoModel.findOne({
      where: { vehiculoId },
      order: [['fechaInicio', 'DESC']],
    });
  }

  private async guardarUbicacion(
    vehicle: Vehiculo,
    location: UbicacionDto,
    transaction?: Transaction,
    registradoEn = new Date(),
  ): Promise<void> {
    await vehicle.update({
      latitudActual: location.latitud,
      longitudActual: location.longitud,
      gpsUpdatedAt: registradoEn,
      gpsAccuracyM: location.accuracy ?? null,
    }, { transaction });
  }

  private async acumularDistanciaReal(
    recorrido: Recorrido,
    previous: UbicacionRecorrido | null,
    current: UbicacionDto,
    registradoEn: Date,
    transaction: Transaction,
  ): Promise<void> {
    if (
      !previous ||
      previous.latitud == null ||
      previous.longitud == null ||
      (previous.precisionM != null && previous.precisionM > 100) ||
      (current.accuracy != null && current.accuracy > 100)
    ) {
      return;
    }

    const elapsedSeconds =
      (registradoEn.getTime() - previous.registradoEn.getTime()) / 1000;
    const elapsedHours = elapsedSeconds / 3600;
    const distance = this.distanciaKm(
      previous.latitud,
      previous.longitud,
      current.latitud,
      current.longitud,
    );
    if (elapsedHours <= 0 || distance < 0.005) return;
    const accuracyAllowanceKm = Math.max(
      0.02,
      ((previous.precisionM ?? 10) + (current.accuracy ?? 10)) / 1000 * 2,
    );
    if (distance > 200 * elapsedHours + accuracyAllowanceKm) return;

    const movementSeconds =
      elapsedSeconds <= MAX_MOVEMENT_INTERVAL_SECONDS &&
      distance / elapsedHours >= 1
        ? Math.round(elapsedSeconds)
        : 0;
    await recorrido.update({
      distanciaRealKm: Number(recorrido.distanciaRealKm ?? 0) + distance,
      tiempoMovimientoSegundos:
        Number(recorrido.tiempoMovimientoSegundos ?? 0) + movementSeconds,
    }, { transaction });
  }

  private async actualizarParadaActual(
    recorridoId: number,
    location: UbicacionDto,
    registradoEn: Date,
    previousPosition: UbicacionRecorrido | null,
    transaction: Transaction,
  ): Promise<void> {
    if (location.accuracy != null && location.accuracy > 100) return;
    const paradasAbiertas = await this.paradaModel.findAll({
      where: { recorridoId, salidaEn: null },
      order: [['llegadaEn', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const paradaAbierta = paradasAbiertas[0];

    if (paradaAbierta) {
      const gapSeconds = previousPosition
        ? (registradoEn.getTime() -
            previousPosition.registradoEn.getTime()) /
          1000
        : 0;
      if (gapSeconds > MAX_STOP_SAMPLE_GAP_SECONDS) {
        const salidaEn = previousPosition?.registradoEn ?? registradoEn;
        const duracionSegundos = Math.max(
          0,
          (salidaEn.getTime() - paradaAbierta.llegadaEn.getTime()) / 1000,
        );
        if (duracionSegundos < STOP_MINIMUM_SECONDS) {
          await paradaAbierta.destroy({ transaction });
        } else {
          await paradaAbierta.update({ salidaEn }, { transaction });
        }
      } else {
        const distanciaActual =
          paradaAbierta.latitud != null && paradaAbierta.longitud != null
            ? this.distanciaKm(
                location.latitud,
                location.longitud,
                Number(paradaAbierta.latitud),
                Number(paradaAbierta.longitud),
              )
            : Infinity;
        if (distanciaActual <= STOP_RADIUS_KM) return;

        const duracionSegundos = Math.max(
          0,
          (registradoEn.getTime() - paradaAbierta.llegadaEn.getTime()) / 1000,
        );
        if (duracionSegundos < STOP_MINIMUM_SECONDS) {
          await paradaAbierta.destroy({ transaction });
        } else {
          await paradaAbierta.update(
            { salidaEn: registradoEn },
            { transaction },
          );
        }
      }
    }

    await this.paradaModel.create(
      {
        recorridoId,
        pedidoId: null,
        latitud: location.latitud,
        longitud: location.longitud,
        llegadaEn: registradoEn,
        salidaEn: null,
      },
      { transaction },
    );
  }

  private async listarParadas(recorridoId: number) {
    const visits = await this.paradaModel.findAll({
      where: { recorridoId },
      order: [['llegadaEn', 'ASC']],
    });
    const now = Date.now();
    const paradasDetectadas = visits.filter((visit) => {
      const duracionSegundos =
        ((visit.salidaEn?.getTime() ?? now) - visit.llegadaEn.getTime()) /
        1000;
      return duracionSegundos >= STOP_MINIMUM_SECONDS;
    });
    const pedidoIds = [
      ...new Set(
        paradasDetectadas
          .map((visit) => visit.pedidoId)
          .filter((pedidoId): pedidoId is number => pedidoId != null),
      ),
    ];
    const orders = pedidoIds.length
      ? await this.pedidoModel.findAll({
          where: { id: { [Op.in]: pedidoIds } },
        })
      : [];
    const orderById = new Map(orders.map((order) => [order.id, order]));

    return paradasDetectadas.map((visit) => ({
      pedidoId: visit.pedidoId,
      destinatario:
        (visit.pedidoId == null
          ? undefined
          : orderById.get(visit.pedidoId)?.destinatario) ?? 'Parada',
      latitud:
        visit.latitud ??
        (visit.pedidoId == null ||
        orderById.get(visit.pedidoId)?.latitud == null
          ? null
          : Number(orderById.get(visit.pedidoId)?.latitud)),
      longitud:
        visit.longitud ??
        (visit.pedidoId == null ||
        orderById.get(visit.pedidoId)?.longitud == null
          ? null
          : Number(orderById.get(visit.pedidoId)?.longitud)),
      llegadaEn: visit.llegadaEn,
      salidaEn: visit.salidaEn,
      duracionSegundos: Math.max(
        0,
        Math.round(
          ((visit.salidaEn?.getTime() ?? now) - visit.llegadaEn.getTime()) /
            1000,
        ),
      ),
      enParada: visit.salidaEn == null,
    }));
  }

  private serializarPedido(pedido: Pedido) {
    return {
      id: pedido.id,
      destinatario: pedido.destinatario,
      direccion: pedido.direccion,
      latitud: Number(pedido.latitud),
      longitud: Number(pedido.longitud),
      estado: pedido.estado,
    };
  }

  private distanciaKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const deltaLat = radians(lat2 - lat1);
    const deltaLon = radians(lon2 - lon1);
    const value =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(radians(lat1)) *
        Math.cos(radians(lat2)) *
        Math.sin(deltaLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }
}
