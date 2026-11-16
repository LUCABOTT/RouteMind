export interface DriverVehicle {
  id: number;
  codigo: string;
  capacidad: number;
  estado: 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
  latitudActual: number | null;
  longitudActual: number | null;
  gpsUpdatedAt: string | null;
  gpsAccuracyM: number | null;
}

export interface DriverProfile {
  usuario: {
    id: number;
    email: string;
    name: string;
    role: string;
    active: boolean;
    createdAt: string;
  };

  conductor: {
    id: number;
    nombre: string;
    telefono: string | null;
    licencia: string | null;
    activo: boolean;
  };

  vehiculos: DriverVehicle[];
}