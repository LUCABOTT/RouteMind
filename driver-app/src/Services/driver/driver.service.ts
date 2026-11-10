import { apiRequest } from '../api/api';

import type {
  DriverProfile,
} from '../../interfaces/driver.interface';

export const driverService = {
  async getProfile(token: string): Promise<DriverProfile> {
    return apiRequest<DriverProfile>('/driver/me', {
      method: 'GET',
      token,
    });
  },
};