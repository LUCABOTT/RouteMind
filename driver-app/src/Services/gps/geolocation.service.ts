
import { Geolocation } from '@capacitor/geolocation';

export const MAX_GPS_ACCURACY_METERS = 100;

export interface GPSPosition {
  latitud: number;
  longitud: number;
  accuracy: number;
}

export const geolocationService = {
  async requestPermission(): Promise<boolean> {
    let permissions = await Geolocation.checkPermissions();

    if (permissions.location !== 'granted') {
      permissions = await Geolocation.requestPermissions({
        permissions: ['location'],
      });
    }

    return permissions.location === 'granted';
  },

  async getCurrentPosition(): Promise<GPSPosition> {
    return new Promise((resolve, reject) => {
      let watchId: string | null = null;
      let settled = false;

      const clearActiveWatch = () => {
        if (watchId === null) return;

        const id = watchId;
        watchId = null;
        void Geolocation.clearWatch({ id }).catch((error: unknown) => {
          console.error('Error cerrando la lectura GPS:', error);
        });
      };

      const timeoutId = window.setTimeout(() => {
        finish(() =>
          reject(
            new Error(
              'No se obtuvo una ubicación GPS precisa. Activa la ubicación precisa y vuelve a intentarlo.',
            ),
          ),
        );
      }, 60000);

      const finish = (complete: () => void) => {
        if (settled) return;

        settled = true;
        window.clearTimeout(timeoutId);
        complete();
        clearActiveWatch();
      };

      void Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 60000,
          maximumAge: 0,
        },
        (position, error) => {
          if (error) {
            finish(() => reject(new Error(error.message)));
            return;
          }

          if (
            !position ||
            !Number.isFinite(position.coords.accuracy) ||
            position.coords.accuracy > MAX_GPS_ACCURACY_METERS
          ) {
            return;
          }

          finish(() =>
            resolve({
              latitud: position.coords.latitude,
              longitud: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }),
          );
        },
      ).then(
        (id) => {
          watchId = id;
          if (settled) clearActiveWatch();
        },
        (error: unknown) => {
          finish(() =>
            reject(
              error instanceof Error
                ? error
                : new Error('No se pudo obtener la ubicación GPS.'),
            ),
          );
        },
      );
    });
  },

  async watchPosition(
    callback: (position: GPSPosition) => void,
    onError?: (error: string) => void,
  ): Promise<string> {
    return Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
      (position, error) => {
        if (error) {
          onError?.(error.message);
          return;
        }

        if (!position) return;

        callback({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
    );
  },

  async clearWatch(watchId: string): Promise<void> {
    await Geolocation.clearWatch({ id: watchId });
  },
};
