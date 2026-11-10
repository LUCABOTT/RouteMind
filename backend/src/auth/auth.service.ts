import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import { AuthCredentialsDto, RegisterDto } from './dto/auth.dto';
import { User } from './models/user.model';
import { UsersService } from './users.service';
import { UserRole } from './roles';
import { Conductor } from '../vehiculos/models/conductor.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,

    @InjectModel(Conductor)
    private readonly conductorModel: typeof Conductor,
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
    const user = await this.validarCredenciales(
      dto.email,
      dto.password,
    );

    return this.createSession(user);
  }

  async driverLogin(dto: AuthCredentialsDto) {
    const user = await this.validarCredenciales(
      dto.email,
      dto.password,
    );

    if (user.role !== UserRole.CONDUCTOR || !user.conductorId) {
      throw new UnauthorizedException(
        'Esta cuenta no tiene acceso a RouteMind Driver',
      );
    }

    const conductor = await this.conductorModel.findByPk(
      user.conductorId,
    );

    if (!conductor || !conductor.activo) {
      throw new UnauthorizedException(
        'La cuenta del conductor no está disponible',
      );
    }

    const session = await this.createSession(user);

    return {
      token: session.token,
      user: {
        ...session.user,
        conductorId: conductor.id,
        conductor: {
          id: conductor.id,
          nombre: conductor.nombre,
        },
      },
    };
  }

  async validarCredenciales(
    email: string,
    password: string,
  ): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (
      !user ||
      !user.active ||
      !(await compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException(
        'Correo o contraseña incorrectos',
      );
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