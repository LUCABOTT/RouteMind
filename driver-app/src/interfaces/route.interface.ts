export interface RouteDelivery {
  id: number;
  destinatario: string;
  direccion: string;
  latitud: number;
  longitud: number;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estado:
    | 'PENDIENTE'
    | 'ASIGNADO'
    | 'EN_CAMINO'
    | 'ENTREGADO'
    | 'CANCELADO';
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