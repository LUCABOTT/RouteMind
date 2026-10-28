import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { AuthCredentialsDto, RegisterDto } from './dto/auth.dto';
import { User } from './models/user.model';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.register(
      dto.name,
      dto.email,
      dto.password,
    );
    return this.createSession(user);
  }

  async login(dto: AuthCredentialsDto) {
    const user = await this.validarCredenciales(dto.email, dto.password);
    return this.createSession(user);
  }

  async validarCredenciales(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (
      !user ||
      !user.active ||
      !(await compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    return user;
  }

  async createSession(user: User) {
    const token = await this.jwtService.signAsync({
      sub: user.id,
    });
    return {
      token,
      user: this.usersService.toSafeUser(user),
    };
  }
}
