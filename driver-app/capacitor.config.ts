
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.routemind.driver',
  appName: 'RouteMind Driver',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
};

export default config;
