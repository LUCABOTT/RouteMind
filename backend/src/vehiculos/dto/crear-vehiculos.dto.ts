
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CrearVehiculoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  conductorId?: number | null;

  @IsInt()
  @Min(1)
  capacidad: number;
}
