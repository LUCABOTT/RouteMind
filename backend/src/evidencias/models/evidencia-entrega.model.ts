
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
} from 'sequelize-typescript';

import { Pedido } from '../../pedidos/models/pedido.model';
import { Recorrido } from '../../recorridos/models/recorrido.model';
import { ParadaRecorrido } from '../../seguimiento/models/parada-recorrido.model';
import { Conductor } from '../../vehiculos/models/conductor.model';

@Table({
  tableName: 'evidencias_entrega',
  timestamps: true,
  underscored: true,
})
export class EvidenciaEntrega extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Pedido)
  @Column({
    type: DataType.INTEGER,
    field: 'pedido_id',
    allowNull: false,
  })
  declare pedidoId: number;

  @BelongsTo(() => Pedido)
  declare pedido?: Pedido;

  @ForeignKey(() => Recorrido)
  @Column({
    type: DataType.INTEGER,
    field: 'recorrido_id',
    allowNull: false,
  })
  declare recorridoId: number;

  @BelongsTo(() => Recorrido)
  declare recorrido?: Recorrido;

  @ForeignKey(() => ParadaRecorrido)
  @Column({
    type: DataType.INTEGER,
    field: 'parada_recorrido_id',
    allowNull: false,
  })
  declare paradaRecorridoId: number;

  @BelongsTo(() => ParadaRecorrido)
  declare paradaRecorrido?: ParadaRecorrido;

  @ForeignKey(() => Conductor)
  @Column({
    type: DataType.INTEGER,
    field: 'conductor_id',
    allowNull: false,
  })
  declare conductorId: number;

  @BelongsTo(() => Conductor)
  declare conductor?: Conductor;

  @Column({
    type: DataType.STRING(255),
    field: 'public_id',
    allowNull: false,
    unique: true,
  })
  declare publicId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare url: string;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  declare formato: string;

  @Column({
    type: DataType.BIGINT,
    field: 'tamano_bytes',
    allowNull: false,
  })
  declare tamanoBytes: string | number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: true,
  })
  declare latitud: number | null;

  @Column({
    type: DataType.DOUBLE,
    allowNull: true,
  })
  declare longitud: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare observaciones: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
