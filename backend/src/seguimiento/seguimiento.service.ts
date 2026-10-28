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
import { UbicacionDto } from './dto/ubicacion.dto';

const ARRIVAL_RADIUS_KM = 0.1;
const DEPARTURE_RADIUS_KM = 0.15;

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
    private readonly pedidosService: PedidosService,
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
    await this.guardarUbicacion(vehicle, location);
    return this.pedidosService.iniciarRecorrido(vehicle.id);
  }

  async registrarUbicacion(userId: number, location: UbicacionDto) {
    return this.sequelize.transaction(async (transaction) => {
      const vehicle = await this.vehiculoAsignado(
        userId,
        location.vehiculoId,
        transaction,
      );
      const recorrido = await this.recorridoActivo(vehicle.id, transaction);
      if (!recorrido) {
        throw new ConflictException('El vehículo no tiene un recorrido activo');
      }

      const previousPosition = {
        latitud: vehicle.latitudActual,
        longitud: vehicle.longitudActual,
        updatedAt: vehicle.gpsUpdatedAt,
        accuracy: vehicle.gpsAccuracyM,
      };
      await this.guardarUbicacion(vehicle, location, transaction);
      await this.acumularDistanciaReal(
        recorrido,
        previousPosition,
        location,
        transaction,
      );
      await this.actualizarParadaActual(
        recorrido.id,
        location,
        transaction,
      );
      return {
        recibido: true,
        registradoEn: vehicle.gpsUpdatedAt,
      };
    });
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
    await this.paradaModel.update(
      { salidaEn: new Date() },
      {
        where: {
          recorridoId: recorrido.id,
          pedidoId,
          salidaEn: null,
        },
      },
    );
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
  ): Promise<void> {
    await vehicle.update({
      latitudActual: location.latitud,
      longitudActual: location.longitud,
      gpsUpdatedAt: new Date(),
      gpsAccuracyM: location.accuracy ?? null,
    }, { transaction });
  }

  private async acumularDistanciaReal(
    recorrido: Recorrido,
    previous: {
      latitud: number | null;
      longitud: number | null;
      updatedAt: Date | null;
      accuracy: number | null;
    },
    current: UbicacionDto,
    transaction: Transaction,
  ): Promise<void> {
    if (
      previous.latitud == null ||
      previous.longitud == null ||
      previous.updatedAt == null ||
      (previous.accuracy != null && previous.accuracy > 100) ||
      (current.accuracy != null && current.accuracy > 100)
    ) {
      return;
    }

    const elapsedHours =
      (Date.now() - previous.updatedAt.getTime()) / 3_600_000;
    const distance = this.distanciaKm(
      previous.latitud,
      previous.longitud,
      current.latitud,
      current.longitud,
    );
    if (elapsedHours <= 0 || distance < 0.005) return;
    const accuracyAllowanceKm = Math.max(
      0.02,
      ((previous.accuracy ?? 10) + (current.accuracy ?? 10)) / 1000 * 2,
    );
    if (distance > 200 * elapsedHours + accuracyAllowanceKm) return;

    await recorrido.update({
      distanciaRealKm:
        Number(recorrido.distanciaRealKm ?? 0) + distance,
    }, { transaction });
  }

  private async actualizarParadaActual(
    recorridoId: number,
    location: UbicacionDto,
    transaction: Transaction,
  ): Promise<void> {
    if (location.accuracy != null && location.accuracy > 100) return;
    const pedidos = await this.pedidoModel.findAll({
      where: { recorridoId, estado: 'EN_CAMINO' },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const paradasAbiertas = await this.paradaModel.findAll({
      where: { recorridoId, salidaEn: null },
      order: [['llegadaEn', 'DESC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const paradaAbierta = paradasAbiertas[0];

    if (paradaAbierta) {
      const pedidoActual = pedidos.find(
        (pedido) => pedido.id === paradaAbierta.pedidoId,
      );
      const distanciaActual = pedidoActual
        ? this.distanciaKm(
            location.latitud,
            location.longitud,
            Number(pedidoActual.latitud),
            Number(pedidoActual.longitud),
          )
        : Infinity;
      if (distanciaActual <= DEPARTURE_RADIUS_KM) return;

      await paradaAbierta.update({ salidaEn: new Date() }, { transaction });
    }

    const pedidoCercano = pedidos.find(
      (pedido) =>
        this.distanciaKm(
          location.latitud,
          location.longitud,
          Number(pedido.latitud),
          Number(pedido.longitud),
        ) <= ARRIVAL_RADIUS_KM,
    );
    if (!pedidoCercano) return;

    await this.paradaModel.create({
      recorridoId,
      pedidoId: pedidoCercano.id,
      llegadaEn: new Date(),
      salidaEn: null,
    }, { transaction });
  }

  private async listarParadas(recorridoId: number) {
    const visits = await this.paradaModel.findAll({
      where: { recorridoId },
      order: [['llegadaEn', 'ASC']],
    });
    const pedidoIds = [...new Set(visits.map((visit) => visit.pedidoId))];
    const orders = pedidoIds.length
      ? await this.pedidoModel.findAll({
          where: { id: { [Op.in]: pedidoIds } },
        })
      : [];
    const orderById = new Map(orders.map((order) => [order.id, order]));
    const now = Date.now();

    return visits.map((visit) => ({
      pedidoId: visit.pedidoId,
      destinatario: orderById.get(visit.pedidoId)?.destinatario ?? 'Parada',
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
