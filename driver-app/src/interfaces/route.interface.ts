export interface RouteDelivery {
  id: number;
  destinatario: string;
  direccion: string;
  latitud: number;
  longitud: number;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estado: 'PENDIENTE' | 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';
}

export interface DriverRoute {
  id: number;
  vehiculoId: number;
  fechaInicio: string;
  fechaFin: string | null;
  distanciaTotalKm: number;
  distanciaEstimadaKm: number | null;
  distanciaRealKm: number | null;
  tiempoMovimientoSegundos: number;
  totalPedidos: number;
  estado: 'EN_CURSO' | 'COMPLETADO';

  vehiculo: {
    id: number;
    codigo: string;
    estado: 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
  };

  pedidos: RouteDelivery[];
}

export interface DriverAssignedDelivery {
  id: number;
  destinatario: string;
  direccion: string;
  latitud: number;
  longitud: number;
  estado: 'PENDIENTE' | 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';
}

export interface DriverDetectedStop {
  id: number;
  pedidoId: number | null;
  destinatario: string;
  latitud: number | null;
  longitud: number | null;
  llegadaEn: string;
  salidaEn: string | null;
  duracionSegundos: number;
  enParada: boolean;
}

export interface DriverDeliveryStop {
  id: number;
  paradaRecorridoId: number;
  pedidoId: number | null;
  destinatario: string;
  latitud: number | null;
  longitud: number | null;
  llegadaEn: string | null;
  salidaEn: string | null;
}

export interface DriverAssignedVehicle {
  id: number;
  codigo: string;
  estado: 'DISPONIBLE' | 'EN_RUTA' | 'MANTENIMIENTO';
  recorridoId: number | null;
  recorridoEstado: string | null;
  pedidos: DriverAssignedDelivery[];
  paradas: DriverDetectedStop[];
  paradasEntrega: DriverDeliveryStop[];
  latitud: number | null;
  longitud: number | null;
  gpsActualizadoEn: string | null;
  gpsPrecisionM: number | null;
}
