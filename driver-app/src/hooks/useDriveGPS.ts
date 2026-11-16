
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  geolocationService,
  MAX_GPS_ACCURACY_METERS,
} from '../Services/gps/geolocation.service';
import { gpsService } from '../Services/gps/gps.service';

export type GPSStatus =
  | 'IDLE'
  | 'REQUESTING'
  | 'TRACKING'
  | 'ERROR';

interface GPSState {
  status: GPSStatus;
  error: string | null;
  lastUpdate: Date | null;
}

const DISTANCE_THRESHOLD_METERS = 15;
const UPDATE_INTERVAL_MS = 60_000;

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadius = 6371000;

  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadius * 2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useDriverGPS(
  token: string | null | undefined,
) {
  const [gps, setGps] = useState<GPSState>({
    status: 'IDLE',
    error: null,
    lastUpdate: null,
  });

  const [trackingVehicleId, setTrackingVehicleId] =
    useState<number | null>(null);

  const startingRef = useRef(false);
  const lastSentAtRef = useRef(0);
  const lastLatitudeRef = useRef<number | null>(null);
  const lastLongitudeRef = useRef<number | null>(null);

  const startTracking = useCallback(
    async (
      vehicleId: number,
      createRoute: boolean,
    ): Promise<void> => {
      if (!token) {
        throw new Error('No existe una sesión válida.');
      }

      if (startingRef.current || trackingVehicleId !== null) {
        return;
      }

      startingRef.current = true;

      setGps({
        status: 'REQUESTING',
        error: null,
        lastUpdate: null,
      });

      try {
        // 1. Solicitar permiso de ubicación.
        const granted =
          await geolocationService.requestPermission();

        if (!granted) {
          throw new Error(
            'Debes permitir el acceso a tu ubicación para iniciar el recorrido.',
          );
        }

        // 2. Obtener la primera coordenada.
        const position =
          await geolocationService.getCurrentPosition();

        const location = {
          vehiculoId: vehicleId,
          latitud: position.latitud,
          longitud: position.longitud,
          accuracy: position.accuracy,
        };

        if (createRoute) {
          await gpsService.startRoute(location, token);
        } else {
          await gpsService.registerLocation(location, token);
        }

        // 4. Guardar la posición inicial para evitar
        // enviar inmediatamente la misma coordenada.
        lastSentAtRef.current = Date.now();
        lastLatitudeRef.current = position.latitud;
        lastLongitudeRef.current = position.longitud;

        // 5. Activar el seguimiento después de la
        // confirmación del backend.
        setTrackingVehicleId(vehicleId);

        setGps({
          status: 'TRACKING',
          error: null,
          lastUpdate: new Date(),
        });
      } catch (error) {
        setGps({
          status: 'ERROR',
          error:
            error instanceof Error
              ? error.message
              : 'No se pudo iniciar el recorrido.',
          lastUpdate: null,
        });

        throw error;
      } finally {
        startingRef.current = false;
      }
    },
    [token, trackingVehicleId],
  );

  const startRoute = useCallback(
    (vehicleId: number) => startTracking(vehicleId, true),
    [startTracking],
  );

  const activateTracking = useCallback(
    (vehicleId: number) => startTracking(vehicleId, false),
    [startTracking],
  );

  // El observador GPS solamente se activa cuando
  // startRoute consigue crear el recorrido.
  useEffect(() => {
    if (!token || trackingVehicleId === null) {
      return;
    }

    let active = true;
    let watchId: string | null = null;
    let sending = false;

    const startWatching = async () => {
      try {
        const newWatchId =
          await geolocationService.watchPosition(
            async (position) => {
              if (!active || sending) return;

              if (
                !Number.isFinite(position.accuracy) ||
                position.accuracy > MAX_GPS_ACCURACY_METERS
              ) {
                setGps((previous) => ({
                  ...previous,
                  status: 'ERROR',
                  error:
                    'La señal GPS es imprecisa. Activa la ubicación precisa para actualizar tu recorrido.',
                }));
                return;
              }

              const now = Date.now();

              const distance =
                lastLatitudeRef.current !== null &&
                lastLongitudeRef.current !== null
                  ? calculateDistance(
                      lastLatitudeRef.current,
                      lastLongitudeRef.current,
                      position.latitud,
                      position.longitud,
                    )
                  : Infinity;

              const hasMoved =
                distance >= DISTANCE_THRESHOLD_METERS;

              const intervalElapsed =
                now - lastSentAtRef.current >=
                UPDATE_INTERVAL_MS;

              if (!hasMoved && !intervalElapsed) {
                return;
              }

              sending = true;

              try {
                await gpsService.registerLocation(
                  {
                    vehiculoId: trackingVehicleId,
                    latitud: position.latitud,
                    longitud: position.longitud,
                    accuracy: position.accuracy,
                  },
                  token,
                );

                if (!active) return;

                lastSentAtRef.current = Date.now();
                lastLatitudeRef.current = position.latitud;
                lastLongitudeRef.current = position.longitud;

                setGps({
                  status: 'TRACKING',
                  error: null,
                  lastUpdate: new Date(),
                });
              } catch (error) {
                if (!active) return;

                setGps((previous) => ({
                  ...previous,
                  status: 'ERROR',
                  error:
                    error instanceof Error
                      ? error.message
                      : 'No se pudo registrar la ubicación GPS.',
                }));
              } finally {
                sending = false;
              }
            },
            (error) => {
              if (!active) return;

              setGps((previous) => ({
                ...previous,
                status: 'ERROR',
                error,
              }));
            },
          );

        if (!active) {
          await geolocationService.clearWatch(newWatchId);
          return;
        }

        watchId = newWatchId;
      } catch (error) {
        if (!active) return;

        setGps((previous) => ({
          ...previous,
          status: 'ERROR',
          error:
            error instanceof Error
              ? error.message
              : 'No se pudo activar el seguimiento GPS.',
        }));
      }
    };

    void startWatching();

    return () => {
      active = false;

      if (watchId !== null) {
        void geolocationService.clearWatch(watchId);
      }
    };
  }, [token, trackingVehicleId]);

  return {
    ...gps,
    trackingVehicleId,
    startRoute,
    activateTracking,
  };
}
