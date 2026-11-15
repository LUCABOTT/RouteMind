
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  ZoomControl,
  CircleMarker,
  useMap,
} from 'react-leaflet';

import { divIcon } from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './DriverMap.css';

import { MAX_GPS_ACCURACY_METERS } from '../../Services/gps/geolocation.service';
import { routeService } from '../../Services/routes/route.service';
import { useAuth } from '../../context/useAuth';

import type {
  DriverAssignedVehicle,
  DriverAssignedDelivery,
} from '../../interfaces/route.interface';

interface DeliveryPoint {
  id: number;
  vehicleId: number;
  vehicleCode: string;
  order: number;
  destinatario: string;
  direccion: string;
  latitud: number;
  longitud: number;
  estado: string;
}

interface MapViewportProps {
  positions: [number, number][];
}

interface VehicleGPSPosition {
  latitud: number | null;
  longitud: number | null;
  gpsActualizadoEn: string | null;
  gpsPrecisionM: number | null;
}

const MAX_GPS_AGE_MS = 5 * 60 * 1000;

const isValidCoordinate = (
  latitud: number | null | undefined,
  longitud: number | null | undefined,
): boolean => {
  if (latitud == null || longitud == null) return false;

  const lat = Number(latitud);
  const lng = Number(longitud);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const hasCurrentGPS = (position: VehicleGPSPosition): boolean => {
  if (
    !isValidCoordinate(position.latitud, position.longitud) ||
    position.gpsPrecisionM == null ||
    !Number.isFinite(Number(position.gpsPrecisionM)) ||
    Number(position.gpsPrecisionM) > MAX_GPS_ACCURACY_METERS ||
    !position.gpsActualizadoEn
  ) {
    return false;
  }

  const updatedAt = new Date(position.gpsActualizadoEn).getTime();
  const age = Date.now() - updatedAt;

  return Number.isFinite(updatedAt) && age >= 0 && age <= MAX_GPS_AGE_MS;
};

const calculateDistanceMeters = (
  from: [number, number],
  to: [number, number],
): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(to[0] - from[0]);
  const longitudeDifference = toRadians(to[1] - from[1]);
  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(from[0])) *
      Math.cos(toRadians(to[0])) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const optimizeDeliveryStops = (
  deliveries: DeliveryPoint[],
  origin: [number, number] | null,
): DeliveryPoint[] => {
  const remaining = deliveries.filter(
    (delivery) =>
      delivery.estado !== 'ENTREGADO' &&
      delivery.estado !== 'CANCELADO',
  );
  const ordered: DeliveryPoint[] = [];
  let currentPosition = origin;

  while (remaining.length > 0) {
    let nearestIndex = 0;

    if (currentPosition) {
      const startPosition = currentPosition;
      let nearestDistance = Infinity;

      remaining.forEach((delivery, index) => {
        const distance = calculateDistanceMeters(startPosition, [
          delivery.latitud,
          delivery.longitud,
        ]);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
    }

    const [nextDelivery] = remaining.splice(nearestIndex, 1);
    ordered.push(nextDelivery);
    currentPosition = [nextDelivery.latitud, nextDelivery.longitud];
  }

  return ordered.map((delivery, index) => ({
    ...delivery,
    order: index + 1,
  }));
};

const MapViewport: React.FC<MapViewportProps> = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 15);
      return;
    }

    map.fitBounds(positions, {
      padding: [50, 50],
      maxZoom: 15,
    });
  }, [map, positions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
};

const MapResizeObserver: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });

    observer.observe(map.getContainer());

    return () => observer.disconnect();
  }, [map]);

  return null;
};

const DriverMap: React.FC = () => {
  const { session } = useAuth();

  const [vehicles, setVehicles] = useState<DriverAssignedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar vehículos y pedidos asignados.
  // showLoading=false permite actualizar el mapa sin ocultarlo.
  const loadVehicles = useCallback(
    async (showLoading = true) => {
      if (!session?.token) {
        setLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        const response = await routeService.getMyVehicles(
          session.token,
        );

        setVehicles(response);
        setError(null);
      } catch (err) {
        console.error(
          'Error cargando entregas para el mapa:',
          err,
        );

        if (showLoading) {
          setError('No fue posible cargar las entregas asignadas.');
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [session?.token],
  );

  // Carga inicial.
  useEffect(() => {
    void loadVehicles();

  }, [loadVehicles]);

  // Actualizar posiciones GPS cada 15 segundos.
  useEffect(() => {
    if (!session?.token) return;

    const interval = window.setInterval(() => {
      void loadVehicles(false);
    }, 15000);

    return () => window.clearInterval(interval);

  }, [session?.token, loadVehicles]);

  // Preparar pedidos y ubicación GPS de cada vehículo.
  const deliveryGroups = useMemo(() => {
    return vehicles.map((vehicle) => {
      const deliveries: DeliveryPoint[] = (
        vehicle.pedidos as DriverAssignedDelivery[]
      )
        .filter((pedido) =>
          isValidCoordinate(
            pedido.latitud,
            pedido.longitud,
          ),
        )
        .map((pedido, index) => ({
          id: pedido.id,
          vehicleId: vehicle.id,
          vehicleCode: vehicle.codigo,
          order: index + 1,
          destinatario: pedido.destinatario,
          direccion: pedido.direccion,
          latitud: Number(pedido.latitud),
          longitud: Number(pedido.longitud),
          estado: pedido.estado,
        }));

      return {
        vehicleId: vehicle.id,
        vehicleCode: vehicle.codigo,

        // Última posición GPS registrada en el backend.
        latitud: vehicle.latitud,
        longitud: vehicle.longitud,
        gpsActualizadoEn: vehicle.gpsActualizadoEn,
        gpsPrecisionM: vehicle.gpsPrecisionM,

        deliveries,
      };
    });
  }, [vehicles]);

  const routeGroups = useMemo(
    () =>
      deliveryGroups.map((group) => {
        const origin = hasCurrentGPS(group)
          ? [Number(group.latitud), Number(group.longitud)] as [
              number,
              number,
            ]
          : null;
        const routeStops = optimizeDeliveryStops(
          group.deliveries,
          origin,
        );
        const routeOrderById = new Map(
          routeStops.map((delivery) => [
            delivery.id,
            delivery.order,
          ]),
        );

        return {
          ...group,
          deliveries: group.deliveries.map((delivery) => ({
            ...delivery,
            order:
              routeOrderById.get(delivery.id) ?? delivery.order,
          })),
          routeStops,
        };
      }),
    [deliveryGroups],
  );

  // Incluir entregas y vehículos en el zoom automático.
  const allPositions = useMemo<[number, number][]>(
    () =>
      routeGroups.flatMap((group) => {
        const positions: [number, number][] =
          group.deliveries.map((delivery) => [
            delivery.latitud,
            delivery.longitud,
          ]);

        if (hasCurrentGPS(group)) {
          positions.push([
            Number(group.latitud),
            Number(group.longitud),
          ]);
        }

        return positions;
      }),
    [routeGroups],
  );

  const totalDeliveries = deliveryGroups.reduce(
    (total, group) => total + group.deliveries.length,
    0,
  );

  const completedDeliveries = deliveryGroups.reduce(
    (total, group) =>
      total +
      group.deliveries.filter(
        (delivery) => delivery.estado === 'ENTREGADO',
      ).length,
    0,
  );

  const vehiclesWithGps = deliveryGroups.filter(hasCurrentGPS).length;

  const createDeliveryIcon = useCallback(
    (order: number, completed: boolean) =>
      divIcon({
        className: `delivery-number-marker ${
          completed ? 'completed' : 'pending'
        }`,
        html: `<span>${order}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
      }),
    [],
  );

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/routes" />
            </IonButtons>

            <IonTitle>Mapa de entregas</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <div className="driver-map-loading">
            <IonSpinner name="crescent" />
            <IonText>Cargando entregas...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="driver-map-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/routes" />
          </IonButtons>

          <IonTitle>Mapa de entregas</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="driver-map-content">
        {error ? (
          <div className="driver-map-message">
            <IonText color="danger">{error}</IonText>
          </div>
        ) : totalDeliveries === 0 ? (
          <div className="driver-map-message">
            <IonText>
              No hay entregas con coordenadas disponibles para mostrar.
            </IonText>
          </div>
        ) : (
          <div className="driver-map-container">

            {/* Resumen superior */}
            <div className="driver-map-summary">
              <div>
                <strong>{totalDeliveries}</strong>
                <span>Entregas</span>
              </div>

              <div>
                <strong>{completedDeliveries}</strong>
                <span>Completadas</span>
              </div>

              <div>
                <strong>
                  {totalDeliveries - completedDeliveries}
                </strong>
                <span>Pendientes</span>
              </div>
            </div>

            {/* Mapa */}
            <MapContainer
              center={allPositions[0]}
              zoom={13}
              scrollWheelZoom
              zoomControl={false}
              className="driver-full-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <ZoomControl position="bottomright" />

              <MapViewport positions={allPositions} />
              <MapResizeObserver />

              {routeGroups.map((group) => {
                const hasGpsPosition = hasCurrentGPS(group);
                const routePositions: [number, number][] = [
                  ...(hasGpsPosition
                    ? [[
                        Number(group.latitud),
                        Number(group.longitud),
                      ] as [number, number]]
                    : []),
                  ...group.routeStops.map(
                    (delivery) =>
                      [
                        delivery.latitud,
                        delivery.longitud,
                      ] as [number, number],
                  ),
                ];

                return (
                  <React.Fragment key={group.vehicleId}>

                    {/* Ruta desde el conductor por el orden optimizado */}
                    {routePositions.length > 1 && (
                      <Polyline
                        positions={routePositions}
                        pathOptions={{
                          color: '#2563eb',
                          weight: 5,
                          opacity: 0.75,
                        }}
                      />
                    )}

                    {/* Ubicación GPS del vehículo */}
                    {hasGpsPosition && (
                      <CircleMarker
                        center={[
                          Number(group.latitud),
                          Number(group.longitud),
                        ]}
                        radius={12}
                        pathOptions={{
                          color: '#ffffff',
                          weight: 4,
                          fillColor: '#16a34a',
                          fillOpacity: 1,
                        }}
                      >
                        <Popup>
                          <div className="driver-map-popup">
                            <strong>
                              Vehículo: {group.vehicleCode}
                            </strong>

                            <p>Ubicación GPS del conductor</p>

                            {group.gpsActualizadoEn && (
                              <p>
                                Última actualización:{' '}
                                {new Date(
                                  group.gpsActualizadoEn,
                                ).toLocaleString()}
                              </p>
                            )}

                            {group.gpsPrecisionM != null && (
                              <p>
                                Precisión GPS:{' '}
                                {group.gpsPrecisionM} m
                              </p>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}

                    {/* Marcadores de las entregas */}
                    {group.deliveries.map((delivery) => {
                      const completed =
                        delivery.estado === 'ENTREGADO';

                      return (
                        <Marker
                          key={`${delivery.vehicleId}-${delivery.id}`}
                          position={[
                            delivery.latitud,
                            delivery.longitud,
                          ]}
                          icon={createDeliveryIcon(
                            delivery.order,
                            completed,
                          )}
                        >
                          <Popup>
                            <div className="driver-map-popup">
                              <strong>
                                Parada {delivery.order} ·{' '}
                                {delivery.vehicleCode}
                              </strong>

                              <p>{delivery.destinatario}</p>
                              <p>{delivery.direccion}</p>

                              <span
                                className={
                                  completed
                                    ? 'popup-status completed'
                                    : 'popup-status pending'
                                }
                              >
                                {completed
                                  ? 'Entregado'
                                  : delivery.estado}
                              </span>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}

                  </React.Fragment>
                );
              })}
            </MapContainer>

            {/* Leyenda */}
            <div className="driver-map-legend">
              <div>
                <span className="legend-marker pending" />
                Pendiente
              </div>

              <div>
                <span className="legend-marker completed" />
                Entregado
              </div>

              <div>
                <span className="legend-marker vehicle" />
                Vehículo GPS
              </div>

              <div>
                <span className="legend-line" />
                Orden de entregas
              </div>
            </div>

            {/* Estado GPS */}
            <div className="driver-map-gps-status">
              {vehiclesWithGps > 0 ? (
                <span className="gps-online">
                  <span className="gps-status-dot" />
                  {vehiclesWithGps} vehículo(s) con ubicación GPS
                </span>
              ) : (
                <span className="gps-offline">
                  Sin ubicación GPS disponible
                </span>
              )}
            </div>

          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DriverMap;
