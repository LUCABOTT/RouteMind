import { apiRequest } from '../api/api';

export interface DriverLocation {
  vehiculoId: number;
  latitud: number;
  longitud: number;
  accuracy?: number;
}

export const gpsService = {
  /**
   * Inicia explícitamente el seguimiento de un recorrido.
   * Debe llamarse desde la acción de iniciar recorrido.
   */
  async startRoute(
    location: DriverLocation,
    token: string,
  ): Promise<unknown> {
    return apiRequest<unknown>('/seguimiento/iniciar', {
      method: 'POST',
      token,
      body: location,
    });
  },

  /**
   * Registra una nueva posición GPS en el historial del recorrido activo.
   */
  async registerLocation(
    location: DriverLocation,
    token: string,
  ): Promise<unknown> {
    return apiRequest<unknown>('/seguimiento/ubicacion', {
      method: 'POST',
      token,
      body: location,
    });
  },
};