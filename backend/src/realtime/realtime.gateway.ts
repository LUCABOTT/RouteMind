import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import { User } from '../auth/models/user.model';

type RouteUpdate = {
  vehiculoId?: number | null;
  recorridoId?: number | null;
  pedidoId?: number | null;
};

type LocationUpdate = {
  vehiculoId: number;
  recorridoId: number;
  registradoEn: Date;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const configuredOrigins = (process.env.FRONTEND_ORIGIN ??
        'http://localhost:5173')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      let isNgrokOrigin = false;
      try {
        isNgrokOrigin = new URL(origin).hostname.endsWith('.ngrok-free.dev');
      } catch {
        isNgrokOrigin = false;
      }

      callback(
        null,
        configuredOrigins.includes(origin) || isNgrokOrigin,
      );
    },
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.readSessionToken(client.handshake.headers.cookie);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: number }>(token);
      const user = await this.userModel.findByPk(payload.sub);
      if (!user?.active) {
        client.disconnect(true);
        return;
      }

      client.join('authenticated');
    } catch (error) {
      this.logger.debug(
        `Rejected websocket connection: ${
          error instanceof Error ? error.message : 'invalid session'
        }`,
      );
      client.disconnect(true);
    }
  }

  publishRouteUpdated(update: RouteUpdate): void {
    this.server.to('authenticated').emit('route.updated', update);
  }

  publishLocationUpdated(update: LocationUpdate): void {
    this.server.to('authenticated').emit('vehicle.location.updated', update);
  }

  private readSessionToken(cookieHeader?: string): string | null {
    const cookie = cookieHeader
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('routeMindToken='));
    if (!cookie) return null;

    const value = cookie.slice('routeMindToken='.length);
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }
}
