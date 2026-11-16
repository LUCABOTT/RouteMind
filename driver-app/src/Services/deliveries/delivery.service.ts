
import { apiRequest } from '../api/api';
import type { DriverDelivery } from '../../interfaces/delivery.interface';

export const deliveryService = {
  async getDeliveries(token: string): Promise<DriverDelivery[]> {
    return apiRequest<DriverDelivery[]>('/driver/deliveries', {
      method: 'GET',
      token,
    });
  },

  async getDeliveryById(
  id: number,
  token: string,
): Promise<DriverDelivery> {
  return apiRequest<DriverDelivery>(
    `/driver/deliveries/${id}`,
    {
      method: 'GET',
      token,
    },
  );
},
};
