import { Vehiculo } from '../../vehiculos/models/vehiculo.model';
import { Recorrido } from '../../recorridos/models/recorrido.model';
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

@Table({
  tableName: 'pedidos',
  timestamps: true,
  underscored: true,
})
export class Pedido extends Model {

     @ForeignKey(() => Vehiculo)
  @Column({
    type: DataType.INTEGER,
    field: 'vehiculo_id',
    allowNull: true,
  })
  declare vehiculoId: number | null;

  @BelongsTo(() => Vehiculo)
  declare vehiculo?: Vehiculo;

  @ForeignKey(() => Recorrido)
@Column({
  type: DataType.INTEGER,
  field: 'recorrido_id',
  allowNull: true,
})
declare recorridoId: number | null;

@BelongsTo(() => Recorrido)
declare recorrido?: Recorrido;

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING(120),
    allowNull: false,
  })
  declare destinatario: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare direccion: string;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  declare latitud: number;

  @Column({
    type: DataType.DOUBLE,
    allowNull: false,
  })
  declare longitud: number;

  @Column({
    type: DataType.ENUM('BAJA', 'MEDIA', 'ALTA'),
    allowNull: false,
    defaultValue: 'MEDIA',
  })
  declare prioridad: 'BAJA' | 'MEDIA' | 'ALTA';

  @Column({
    type: DataType.ENUM(
      'PENDIENTE',
      'ASIGNADO',
      'EN_CAMINO',
      'ENTREGADO',
      'CANCELADO',
    ),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  })
  declare estado:
    | 'PENDIENTE'
    | 'ASIGNADO'
    | 'EN_CAMINO'
    | 'ENTREGADO'
    | 'CANCELADO';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare observaciones: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  declare updatedAt: Date;
}
