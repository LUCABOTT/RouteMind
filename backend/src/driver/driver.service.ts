import {
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


}