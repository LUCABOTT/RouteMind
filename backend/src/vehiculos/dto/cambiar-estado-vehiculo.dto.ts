import { IsEnum } from 'class-validator';
import { EstadoVehiculo } from '../models/vehiculo.model';

export class CambiarEstadoVehiculoDto {
  @IsEnum(EstadoVehiculo)
  estado: EstadoVehiculo;
}
