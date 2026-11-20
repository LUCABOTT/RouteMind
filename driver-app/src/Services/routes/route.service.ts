import type {
  DriverRoute,
  DriverAssignedVehicle,
} from '../../interfaces/route.interface';
import { apiRequest } from '../api/api';

export const routeService = {
  async getTodayRoutes(token: string): Promise<DriverRoute[]> {
    return apiRequest<DriverRoute[]>('/driver/routes/today', {
      method: 'GET',
      token,
    });
  },

  async getMyVehicles(
    token: string,
  ): Promise<DriverAssignedVehicle[]> {
    return apiRequest<DriverAssignedVehicle[]>(
      '/seguimiento/mis-vehiculos',
      {
        method: 'GET',
        token,
      },
    );
  },

  async markDelivered(
    vehicleId: number,
    orderId: number,
    token: string,
  ): Promise<unknown> {
    return apiRequest<unknown>(
      `/seguimiento/vehiculos/${vehicleId}/pedidos/${orderId}/entregar`,
      {
        method: 'PATCH',
        token,
      },
    );
  },
};
