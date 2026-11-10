import { apiRequest } from '../api/api';
import type { DriverRoute } from '../../interfaces/route.interface';

export const routeService = {
  async getTodayRoutes(token: string): Promise<DriverRoute[]> {
    return apiRequest<DriverRoute[]>('/driver/routes/today', {
      method: 'GET',
      token,
    });
  },
};