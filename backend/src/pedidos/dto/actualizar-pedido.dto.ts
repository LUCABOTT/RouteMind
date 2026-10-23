
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

import { PrioridadPedido } from './crear-pedidos.dto';

export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export class ActualizarPedidoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  destinatario?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsLatitude()
  latitud?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsLongitude()
  longitud?: number;

  @IsOptional()
  @IsEnum(PrioridadPedido)
  prioridad?: PrioridadPedido;

  @IsOptional()
  @IsEnum(EstadoPedido)
  estado?: EstadoPedido;

  @IsOptional()
  @IsString()
  observaciones?: string | null;
}
