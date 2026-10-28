import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ActualizarVehiculoDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  conductorId?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidad?: number;
}
