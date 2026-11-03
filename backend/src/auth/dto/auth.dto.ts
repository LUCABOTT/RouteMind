import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthCredentialsDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

export class RegisterDto extends AuthCredentialsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
