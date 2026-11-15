import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { User } from '../auth/models/user.model';
import { Conductor } from '../vehiculos/models/conductor.model';
import { Vehiculo } from '../vehiculos/models/vehiculo.model';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { Pedido } from '../pedidos/models/pedido.model';

@Injectable()
export class DriverService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(Conductor)
    private readonly conductorModel: typeof Conductor,

    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,

    @InjectModel(Recorrido)
    private readonly recorridoModel: typeof Recorrido,

    @InjectModel(Pedido)
    private readonly pedidoModel: typeof Pedido,
  ) {}

  /**
   * Obtiene el conductor autenticado y sus vehículos.
   */
  private async obtenerConductor(conductorId: number) {
    if (!conductorId) {
      throw new ForbiddenException(
        'Esta cuenta no tiene un conductor asociado',
      );
    }

    const conductor = await this.conductorModel.findByPk(
      conductorId,
      {
        include: [
          {
            model: Vehiculo,
            as: 'vehiculos',
            attributes: [
              'id',
              'codigo',
              'capacidad',
              'estado',
              'latitudActual',
              'longitudActual',
              'gpsUpdatedAt',
              'gpsAccuracyM',
            ],
          },
        ],
      },
    );

    if (!conductor || !conductor.activo) {
      throw new NotFoundException(
        'No se encontró un conductor activo',
      );
    }

    return conductor;
  }

  /**
   * GET /api/driver/me
   */
  async obtenerMiPerfil(userId: number, conductorId: number) {
    const [user, conductor] = await Promise.all([
      this.userModel.findByPk(userId, {
        attributes: [
          'id',
          'email',
          'name',
          'role',
          'active',
          'createdAt',
        ],
      }),

      this.obtenerConductor(conductorId),
    ]);

    if (!user) {
      throw new NotFoundException(
        'No se encontró la cuenta del usuario',
      );
    }

    return {
      usuario: user,
      conductor: {
        id: conductor.id,
        nombre: conductor.nombre,
        telefono: conductor.telefono,
        licencia: conductor.licencia,
        activo: conductor.activo,
      },
      vehiculos: conductor.vehiculos ?? [],
    };
  }

  /**
   * GET /api/driver/routes/today
   */
  async obtenerRecorridosDelDia(conductorId: number) {
    await this.obtenerConductor(conductorId);

    // Inicio y fin del día según la zona horaria del servidor.
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const recorridos = await this.recorridoModel.findAll({
      where: {
        fechaInicio: {
          [Op.between]: [inicioDia, finDia],
        },
      },
      include: [
        {
          model: Vehiculo,
          as: 'vehiculo',
          required: true,
          where: {
            conductorId,
          },
          attributes: [
            'id',
            'codigo',
            'estado',
          ],
        },
        {
          model: Pedido,
          as: 'pedidos',
          attributes: [
            'id',
            'destinatario',
            'direccion',
            'latitud',
            'longitud',
            'prioridad',
            'estado',
          ],
        },
      ],
      order: [['fechaInicio', 'DESC']],
    });

    return recorridos;
  }

  /**
   * GET /api/driver/deliveries
   */
  async obtenerEntregas(conductorId: number) {
    const conductor = await this.obtenerConductor(conductorId);

    const vehiculoIds = (conductor.vehiculos ?? []).map(
      (vehiculo) => vehiculo.id,
    );

    if (vehiculoIds.length === 0) {
      return [];
    }

    const pedidos = await this.pedidoModel.findAll({
      where: {
        vehiculoId: {
          [Op.in]: vehiculoIds,
        },
      },
      include: [
        {
          model: Vehiculo,
          as: 'vehiculo',
          attributes: [
            'id',
            'codigo',
          ],
        },
        {
          model: Recorrido,
          as: 'recorrido',
          required: false,
          attributes: [
            'id',
            'fechaInicio',
            'fechaFin',
            'estado',
            'distanciaEstimadaKm',
            'distanciaRealKm',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return pedidos;
  }


  /**
   * GET /api/driver/deliveries/:id
   * Obtiene el detalle de un pedido perteneciente al conductor autenticado.
   */
  async obtenerDetalleEntrega(
    pedidoId: number,
    conductorId: number,
  ) {
    // Verificar que el conductor exista y esté activo.
    await this.obtenerConductor(conductorId);

    const pedido = await this.pedidoModel.findOne({
      where: {
        id: pedidoId,
      },
      include: [
        {
          model: Vehiculo,
          as: 'vehiculo',
          required: true,
          where: {
            conductorId,
          },
          attributes: [
            'id',
            'codigo',
            'estado',
            'latitudActual',
            'longitudActual',
          ],
        },
        {
          model: Recorrido,
          as: 'recorrido',
          required: false,
          attributes: [
            'id',
            'fechaInicio',
            'fechaFin',
            'estado',
            'distanciaEstimadaKm',
            'distanciaRealKm',
          ],
        },
      ],
    });

    if (!pedido) {
      throw new NotFoundException(
        'No se encontró el pedido o no tienes permiso para consultarlo',
      );
    }

    return pedido;
  }


  /**
 * POST /api/driver/vehicles/:vehicleId/location
 * Actualiza la última posición GPS del vehículo.
 */
async actualizarUbicacion(
  vehicleId: number,
  conductorId: number,
  body: {
    latitud: number;
    longitud: number;
    accuracy?: number | null;
  },
) {
  const { latitud, longitud, accuracy } = body;

  // Validar latitud.
  if (
    typeof latitud !== 'number' ||
    !Number.isFinite(latitud) ||
    latitud < -90 ||
    latitud > 90
  ) {
    throw new BadRequestException(
      'La latitud no es válida',
    );
  }

  // Validar longitud.
  if (
    typeof longitud !== 'number' ||
    !Number.isFinite(longitud) ||
    longitud < -180 ||
    longitud > 180
  ) {
    throw new BadRequestException(
      'La longitud no es válida',
    );
  }

  // Validar precisión GPS, cuando se proporciona.
  if (
    accuracy !== undefined &&
    accuracy !== null &&
    (
      typeof accuracy !== 'number' ||
      !Number.isFinite(accuracy) ||
      accuracy < 0
    )
  ) {
    throw new BadRequestException(
      'La precisión GPS no es válida',
    );
  }

  // Verificar que el conductor exista y esté activo.
  await this.obtenerConductor(conductorId);

  // Buscar exclusivamente un vehículo de este conductor.
  const vehiculo = await this.vehiculoModel.findOne({
    where: {
      id: vehicleId,
      conductorId,
    },
  });

  if (!vehiculo) {
    throw new NotFoundException(
      'No se encontró el vehículo o no pertenece a este conductor',
    );
  }

  // Actualizar posición y fecha de registro.
  await vehiculo.update({
    latitudActual: latitud,
    longitudActual: longitud,
    gpsUpdatedAt: new Date(),
    gpsAccuracyM:
      accuracy === undefined
        ? vehiculo.gpsAccuracyM
        : accuracy,
  });

  return {
    message: 'Ubicación GPS actualizada correctamente',
    vehiculo: {
      id: vehiculo.id,
      codigo: vehiculo.codigo,
      latitudActual: vehiculo.latitudActual,
      longitudActual: vehiculo.longitudActual,
      gpsUpdatedAt: vehiculo.gpsUpdatedAt,
      gpsAccuracyM: vehiculo.gpsAccuracyM,
    },
  };
}


}