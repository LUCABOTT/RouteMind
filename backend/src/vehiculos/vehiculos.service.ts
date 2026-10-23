
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vehiculo } from './models/vehiculo.model';
import { CrearVehiculoDto } from './dto/crear-vehiculos.dto';


@Injectable()
export class VehiculosService {
  constructor(
  
    @InjectModel(Vehiculo)
    private readonly vehiculoModel: typeof Vehiculo,
  ) {}

  async crear(dto: CrearVehiculoDto): Promise<Vehiculo> {
    const existente = await this.vehiculoModel.findOne({
      where: { codigo: dto.codigo },
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe un vehículo con ese código',
      );
    }

    return this.vehiculoModel.create({
      ...dto,
      estado: 'DISPONIBLE',
    });
  }

  async listar(): Promise<Vehiculo[]> {
    return this.vehiculoModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async buscarPorId(id: number): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoModel.findByPk(id);

    if (!vehiculo) {
      throw new NotFoundException(
        `No existe un vehículo con ID ${id}`,
      );
    }

    return vehiculo;
  }
}
