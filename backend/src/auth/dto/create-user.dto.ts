import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../roles';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsIn([UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.VIEWER])
  role: UserRole = UserRole.PLANIFICADOR;
}
