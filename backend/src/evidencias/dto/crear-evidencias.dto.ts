
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

export class CrearEvidenciaDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d*$/, {
    message: 'pedidoId debe ser un número entero positivo',
  })
  pedidoId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d*$/, {
    message: 'recorridoId debe ser un número entero positivo',
  })
  recorridoId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9]\d*$/, {
    message: 'paradaRecorridoId debe ser un número entero positivo',
  })
  paradaRecorridoId: string;

  @IsOptional()
  @IsString()
  @Matches(/^-?\d+(\.\d+)?$/, {
    message: 'latitud debe ser un número válido',
  })
  latitud?: string;

  @IsOptional()
  @IsString()
  @Matches(/^-?\d+(\.\d+)?$/, {
    message: 'longitud debe ser un número válido',
  })
  longitud?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string;
}
