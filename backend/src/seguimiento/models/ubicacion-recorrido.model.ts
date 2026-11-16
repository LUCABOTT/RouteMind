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
  tableName: 'ubicaciones_recorrido',
  timestamps: true,
  underscored: true,
})
export class UbicacionRecorrido extends Model {
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
    type: DataType.DOUBLE,
    field: 'precision_m',
    allowNull: true,
  })
  declare precisionM: number | null;

  @Column({
    type: DataType.DATE,
    field: 'registrado_en',
    allowNull: false,
  })
  declare registradoEn: Date;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
