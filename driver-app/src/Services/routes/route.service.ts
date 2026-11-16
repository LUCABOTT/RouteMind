import { apiRequest } from '../api/api';
import type {
  DriverRoute,
  DriverAssignedVehicle,
} from '../../interfaces/route.interface';

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
};
