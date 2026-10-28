import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Recorrido } from '../recorridos/models/recorrido.model';
import { ActualizarVehiculoDto } from './dto/actualizar-vehiculo.dto';
import { CrearVehiculoDto } from './dto/crear-vehiculos.dto';
import { Conductor } from './models/conductor.model';
import { EstadoVehiculo, Vehiculo } from './models/vehiculo.model';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,
    @InjectModel(Conductor)
    private readonly conductorModel: typeof Conductor,
    @InjectModel(Recorrido)
    private readonly recorridoModel: typeof Recorrido,
  ) {}

  async crear(dto: CrearVehiculoDto) {
    if (dto.conductorId) await this.buscarConductor(dto.conductorId);
    try {
      const vehiculo = await this.vehiculoModel.create({
        codigo: dto.codigo.trim(),
        capacidad: dto.capacidad,
        conductorId: dto.conductorId ?? null,
        estado: EstadoVehiculo.DISPONIBLE,
      });
      return this.buscarPorId(vehiculo.id);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException('Ya existe un vehículo con ese código');
      }
      throw error;
    }
  }

  async listar() {
    return this.vehiculoModel.findAll({
      include: [{ model: Conductor, as: 'conductorInfo' }],
      order: [['createdAt', 'DESC']],
    }).then((vehiculos) => vehiculos.map((vehiculo) => this.serializar(vehiculo)));
  }

  async buscarPorId(id: number) {
    const vehiculo = await this.vehiculoModel.findByPk(id, {
      include: [{ model: Conductor, as: 'conductorInfo' }],
    });
    if (!vehiculo) {
      throw new NotFoundException(`No existe un vehículo con ID ${id}`);
    }
    return this.serializar(vehiculo);
  }

  async actualizar(id: number, dto: ActualizarVehiculoDto) {
    const vehiculo = await this.buscarModelo(id);
    if (dto.conductorId) await this.buscarConductor(dto.conductorId);
    try {
      await vehiculo.update({
        ...dto,
        codigo: dto.codigo?.trim(),
        conductorId:
          dto.conductorId === undefined ? vehiculo.conductorId : dto.conductorId,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException('Ya existe un vehículo con ese código');
      }
      throw error;
    }
    return this.buscarPorId(id);
  }

  async cambiarEstado(id: number, estado: EstadoVehiculo) {
    await this.sequelize.transaction(async (transaction) => {
      const vehiculo = await this.vehiculoModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!vehiculo) {
        throw new NotFoundException(`No existe un vehículo con ID ${id}`);
      }

      if (
        estado === EstadoVehiculo.EN_RUTA &&
        vehiculo.estado !== EstadoVehiculo.EN_RUTA
      ) {
        throw new ConflictException(
          'El estado EN_RUTA se establece al iniciar un recorrido',
        );
      }

      const recorridoActivo = await this.recorridoModel.findOne({
        where: { vehiculoId: id, estado: 'EN_CURSO' },
        transaction,
      });
      if (recorridoActivo && estado !== EstadoVehiculo.EN_RUTA) {
        throw new ConflictException(
          'No se puede cambiar el estado mientras haya un recorrido en curso',
        );
      }

      await vehiculo.update({ estado }, { transaction });
    });
    return this.buscarPorId(id);
  }

  async eliminar(id: number): Promise<{ message: string }> {
    const vehiculo = await this.buscarModelo(id);
    const recorridos = await this.recorridoModel.count({
      where: { vehiculoId: id },
    });
    if (recorridos > 0) {
      throw new ConflictException(
        'No se puede eliminar un vehículo con historial de recorridos',
      );
    }
    await vehiculo.destroy();
    return { message: 'Vehículo eliminado' };
  }

  private async buscarModelo(id: number): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoModel.findByPk(id);
    if (!vehiculo) {
      throw new NotFoundException(`No existe un vehículo con ID ${id}`);
    }
    return vehiculo;
  }

  private async buscarConductor(id: number): Promise<Conductor> {
    const conductor = await this.conductorModel.findByPk(id);
    if (!conductor || !conductor.activo) {
      throw new NotFoundException('No existe un conductor activo con ese ID');
    }
    return conductor;
  }

  private serializar(vehiculo: Vehiculo) {
    const data = vehiculo.toJSON() as Record<string, unknown>;
    const conductorInfo = vehiculo.conductorInfo;
    return {
      ...data,
      conductor: conductorInfo?.nombre ?? null,
    };
  }
}
