import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UbicacionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehiculoId: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accuracy?: number;
}
