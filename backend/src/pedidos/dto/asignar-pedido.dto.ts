
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AsignarPedidoDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehiculoId: number;
}
