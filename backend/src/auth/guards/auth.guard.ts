import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import type { Request } from 'express';
import { User } from '../models/user.model';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface AuthenticatedRequest extends Request {
  user?: Pick<User, 'id' | 'email' | 'name' | 'role' | 'conductorId'>;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.routeMindToken;
    if (!token) throw new UnauthorizedException('Inicia sesión para continuar');

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number }>(token);
      const user = await this.userModel.findByPk(payload.sub);

      if (!user || !user.active) {
        throw new UnauthorizedException('La cuenta no está disponible');
      }

      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        conductorId: user.conductorId,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('La sesión no es válida');
    }
  }
}
