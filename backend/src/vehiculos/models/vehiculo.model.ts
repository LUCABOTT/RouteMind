
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
import { Conductor } from './conductor.model';

export enum EstadoVehiculo {
  DISPONIBLE = 'DISPONIBLE',
  EN_RUTA = 'EN_RUTA',
  MANTENIMIENTO = 'MANTENIMIENTO',
}

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

  @ForeignKey(() => Conductor)
  @Column({
    type: DataType.INTEGER,
    field: 'conductor_id',
    allowNull: true,
  })
  declare conductorId: number | null;

  @BelongsTo(() => Conductor)
  declare conductorInfo?: Conductor;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare capacidad: number;

  @Column({
    type: DataType.ENUM(...Object.values(EstadoVehiculo)),
    allowNull: false,
    defaultValue: EstadoVehiculo.DISPONIBLE,
  })
  declare estado: EstadoVehiculo;

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

  @Column({
    type: DataType.DATE,
    field: 'gps_updated_at',
    allowNull: true,
  })
  declare gpsUpdatedAt: Date | null;

  @Column({
    type: DataType.DOUBLE,
    field: 'gps_accuracy_m',
    allowNull: true,
  })
  declare gpsAccuracyM: number | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
