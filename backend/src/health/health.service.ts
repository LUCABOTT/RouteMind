import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      status: 'ok',
      application: 'RouteMind API',
      timestamp: new Date().toISOString(),
    };
  }
}