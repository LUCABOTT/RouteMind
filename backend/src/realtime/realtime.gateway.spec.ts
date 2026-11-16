import { jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { User } from '../auth/models/user.model';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeGateway', () => {
  const jwtService = {
    verifyAsync: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const userModel = {
    findByPk: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const gateway = new RealtimeGateway(
    jwtService as unknown as JwtService,
    userModel as unknown as typeof User,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('authenticates sockets using the HTTP session cookie', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 8 });
    userModel.findByPk.mockResolvedValue({ id: 8, active: true });
    const socket = {
      handshake: { headers: { cookie: 'other=value; routeMindToken=jwt' } },
      join: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket;

    await gateway.handleConnection(socket);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('jwt');
    expect(socket.join).toHaveBeenCalledWith('authenticated');
    expect(socket.disconnect).not.toHaveBeenCalled();
  });

  it('rejects sockets without a session cookie', async () => {
    const socket = {
      handshake: { headers: { cookie: undefined } },
      join: jest.fn(),
      disconnect: jest.fn(),
    } as unknown as Socket;

    await gateway.handleConnection(socket);

    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
});
