
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { Vehiculo } from '../../vehiculos/models/vehiculo.model';
import { Pedido } from '../../pedidos/models/pedido.model';

@Table({
  tableName: 'recorridos',
  timestamps: true,
  underscored: true,
})
export class Recorrido extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Vehiculo)
  @Column({
    type: DataType.INTEGER,
    field: 'vehiculo_id',
    allowNull: false,
  })
  declare vehiculoId: number;

  @BelongsTo(() => Vehiculo)
  declare vehiculo?: Vehiculo;

  @HasMany(() => Pedido)
  declare pedidos?: Pedido[];

  @Column({
    type: DataType.DATE,
    field: 'fecha_inicio',
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare fechaInicio: Date;

  @Column({
    type: DataType.DATE,
    field: 'fecha_fin',
    allowNull: true,
  })
  declare fechaFin: Date | null;

  @Column({
    type: DataType.DOUBLE,
    field: 'distancia_total_km',
    allowNull: false,
    defaultValue: 0,
  })
  declare distanciaTotalKm: number;

  @Column({
    type: DataType.DOUBLE,
    field: 'distancia_estimada_km',
    allowNull: true,
  })
  declare distanciaEstimadaKm: number | null;

  @Column({
    type: DataType.DOUBLE,
    field: 'distancia_real_km',
    allowNull: true,
  })
  declare distanciaRealKm: number | null;

  @Column({
    type: DataType.INTEGER,
    field: 'total_pedidos',
    allowNull: false,
    defaultValue: 0,
  })
  declare totalPedidos: number;

  @Column({
    type: DataType.ENUM('EN_CURSO', 'COMPLETADO'),
    allowNull: false,
    defaultValue: 'EN_CURSO',
  })
  declare estado: 'EN_CURSO' | 'COMPLETADO';

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
