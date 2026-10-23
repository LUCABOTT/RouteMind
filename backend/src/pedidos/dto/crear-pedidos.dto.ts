
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum PrioridadPedido {
  BAJA = 'BAJA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export class CrearPedidoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  destinatario: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsLatitude()
  latitud: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsLongitude()
  longitud: number;

  @IsOptional()
  @IsEnum(PrioridadPedido)
  prioridad?: PrioridadPedido;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
