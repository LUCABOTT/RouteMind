
export type DeliveryStatus =
  | 'PENDIENTE'
  | 'ASIGNADO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type DeliveryPriority = 'BAJA' | 'MEDIA' | 'ALTA';

export interface DriverDelivery {
  id: number;
  destinatario: string;
  direccion: string;
  latitud: number;
  longitud: number;
  prioridad: DeliveryPriority;
  estado: DeliveryStatus;
  observaciones?: string | null;

  vehiculo?: {
    id: number;
    codigo: string;
    latitudActual: number | null;
    longitudActual: number | null;
    gpsUpdatedAt: string | null;
  } | null;

  recorrido?: {
    id: number;
    estado: string;
    fechaInicio: string;
  } | null;

  createdAt?: string;
  updatedAt?: string;
}
