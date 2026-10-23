
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'vehiculos',
  timestamps: true,
  underscored: true,
})
export class Vehiculo extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  declare codigo: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare conductor: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare capacidad: number;

  @Column({
    type: DataType.ENUM('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO'),
    allowNull: false,
    defaultValue: 'DISPONIBLE',
  })
  declare estado:
    | 'DISPONIBLE'
    | 'EN_RUTA'
    | 'MANTENIMIENTO';

  @Column({
    type: DataType.DOUBLE,
    allowNull: true,
  })
  declare latitudActual: number | null;

  @Column({
    type: DataType.DOUBLE,
    allowNull: true,
  })
  declare longitudActual: number | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
