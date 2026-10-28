import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'paradas_recorrido',
  timestamps: true,
  underscored: true,
})
export class ParadaRecorrido extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    field: 'recorrido_id',
    allowNull: false,
  })
  declare recorridoId: number;

  @Column({
    type: DataType.INTEGER,
    field: 'pedido_id',
    allowNull: false,
  })
  declare pedidoId: number;

  @Column({
    type: DataType.DATE,
    field: 'llegada_en',
    allowNull: false,
  })
  declare llegadaEn: Date;

  @Column({
    type: DataType.DATE,
    field: 'salida_en',
    allowNull: true,
  })
  declare salidaEn: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
