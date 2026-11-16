import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearConductorDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  licencia?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ActualizarConductorDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  licencia?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
