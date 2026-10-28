import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Vehiculo } from './vehiculo.model';

@Table({
  tableName: 'conductores',
  timestamps: true,
  underscored: true,
})
export class Conductor extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare nombre: string;

  @Column({
    type: DataType.STRING(30),
    allowNull: true,
    unique: true,
  })
  declare telefono: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    unique: true,
  })
  declare licencia: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare activo: boolean;

  @HasMany(() => Vehiculo)
  declare vehiculos?: Vehiculo[];
}
