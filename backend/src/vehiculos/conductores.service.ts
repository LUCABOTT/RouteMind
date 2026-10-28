import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { hash } from 'bcryptjs';
import { Op } from 'sequelize';
import { User } from '../auth/models/user.model';
import { UserRole } from '../auth/roles';
import { ActualizarConductorDto, CrearConductorDto } from './dto/crear-conductor.dto';
import { Conductor } from './models/conductor.model';
import { Vehiculo } from './models/vehiculo.model';

@Injectable()
export class ConductoresService {
  constructor(
    @InjectModel(Conductor)
    private readonly conductorModel: typeof Conductor,
    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async crear(dto: CrearConductorDto): Promise<Conductor> {
    try {
      return await this.conductorModel.create({
        ...dto,
        nombre: dto.nombre.trim(),
        telefono: dto.telefono?.trim() || null,
        licencia: dto.licencia?.trim() || null,
        activo: dto.activo ?? true,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException('El teléfono o licencia ya está registrado');
      }
      throw error;
    }
  }

  async listar() {
    const conductores = await this.conductorModel.findAll({
      order: [['nombre', 'ASC']],
    });
    const cuentas = conductores.length
      ? await this.userModel.findAll({
          where: {
            conductorId: {
              [Op.in]: conductores.map((conductor) => conductor.id),
            },
          },
          attributes: ['id', 'email', 'active', 'conductorId'],
        })
      : [];
    const cuentaPorConductor = new Map(
      cuentas.map((cuenta) => [cuenta.conductorId, cuenta]),
    );

    return conductores.map((conductor) => {
      const cuenta = cuentaPorConductor.get(conductor.id);
      return {
        ...conductor.toJSON(),
        cuenta: cuenta
          ? {
              id: cuenta.id,
              email: cuenta.email,
              active: cuenta.active,
            }
          : null,
      };
    });
  }

  async crearCuenta(
    id: number,
    email: string,
    password: string,
  ) {
    const conductor = await this.buscarPorId(id);
    if (!conductor.activo) {
      throw new ConflictException(
        'Activa al conductor antes de crear su cuenta',
      );
    }
    const existingLinkedAccount = await this.userModel.findOne({
      where: { conductorId: conductor.id },
    });
    if (existingLinkedAccount) {
      throw new ConflictException(
        'Este conductor ya tiene una cuenta vinculada',
      );
    }

    try {
      const user = await this.userModel.create({
        name: conductor.nombre,
        email: email.trim().toLowerCase(),
        passwordHash: await hash(password, 12),
        role: UserRole.CONDUCTOR,
        active: true,
        conductorId: conductor.id,
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException(
          'El correo ya existe o el conductor ya tiene una cuenta',
        );
      }
      throw error;
    }
  }

  async buscarPorId(id: number): Promise<Conductor> {
    const conductor = await this.conductorModel.findByPk(id);
    if (!conductor) throw new NotFoundException('No existe el conductor');
    return conductor;
  }

  async actualizar(
    id: number,
    dto: ActualizarConductorDto,
  ): Promise<Conductor> {
    const conductor = await this.buscarPorId(id);
    try {
      await conductor.update({
        ...dto,
        nombre: dto.nombre?.trim(),
        telefono:
          dto.telefono === undefined
            ? conductor.telefono
            : dto.telefono?.trim() || null,
        licencia:
          dto.licencia === undefined
            ? conductor.licencia
            : dto.licencia?.trim() || null,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException('El teléfono o licencia ya está registrado');
      }
      throw error;
    }
    return conductor;
  }

  async eliminar(id: number): Promise<{ message: string }> {
    const conductor = await this.buscarPorId(id);
    const vehiculosAsignados = await this.vehiculoModel.count({
      where: { conductorId: id },
    });
    if (vehiculosAsignados > 0) {
      throw new ConflictException(
        'Reasigna los vehículos antes de eliminar este conductor',
      );
    }
    const cuenta = await this.userModel.findOne({
      where: { conductorId: id },
    });
    if (cuenta) {
      throw new ConflictException(
        'Elimina primero la cuenta de acceso vinculada al conductor',
      );
    }
    await conductor.destroy();
    return { message: 'Conductor eliminado' };
  }
}
