
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IonSpinner } from '@ionic/react';

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
  useMap,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import './DeliveryMap.css';

interface DeliveryMapProps {
  latitud: number;
  longitud: number;
  destinatario: string;
  direccion: string;

  vehiculoLatitud?: number | null;
  vehiculoLongitud?: number | null;
  codigoVehiculo?: string;
}

interface MapBoundsProps {
  destino: [number, number];
  vehiculo: [number, number] | null;
  onReady: () => void;
}

const MapBounds: React.FC<MapBoundsProps> = ({
  destino,
  vehiculo,
  onReady,
}) => {
  const map = useMap();

  useEffect(() => {
    if (vehiculo) {
      const bounds = map.getBounds();
      if (bounds.contains(destino) && bounds.contains(vehiculo)) {
        onReady();
        return;
      }

      map.fitBounds([destino, vehiculo], {
        padding: [40, 40],
        maxZoom: 16,
        animate: false,
      });
    } else if (!map.getBounds().contains(destino)) {
      map.setView(destino, 16, { animate: false });
    }
    onReady();
  }, [map, destino, vehiculo, onReady]);

  return null;
};

const MapSizeObserver: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false, debounceMoveend: true });
    });

    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
};

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  latitud,
  longitud,
  destinatario,
  direccion,
  vehiculoLatitud,
  vehiculoLongitud,
  codigoVehiculo,
}) => {
  const hasVehicleLocation =
    vehiculoLatitud != null &&
    vehiculoLongitud != null &&
    Number.isFinite(Number(vehiculoLatitud)) &&
    Number.isFinite(Number(vehiculoLongitud)) &&
    Number(vehiculoLatitud) >= -90 &&
    Number(vehiculoLatitud) <= 90 &&
    Number(vehiculoLongitud) >= -180 &&
    Number(vehiculoLongitud) <= 180;

  const destination = useMemo<[number, number]>(
    () => [latitud, longitud],
    [latitud, longitud],
  );
  const vehiclePosition = useMemo<[number, number] | null>(
    () =>
      hasVehicleLocation
        ? [Number(vehiculoLatitud), Number(vehiculoLongitud)]
        : null,
    [hasVehicleLocation, vehiculoLatitud, vehiculoLongitud],
  );
  const [mapReady, setMapReady] = useState(false);
  const [tilesLoading, setTilesLoading] = useState(true);
  const [tileLoadError, setTileLoadError] = useState(false);

  const markMapReady = useCallback(() => setMapReady(true), []);
  const tileEventHandlers = useMemo(
    () => ({
      loading: () => {
        setTilesLoading(true);
        setTileLoadError(false);
      },
      load: () => setTilesLoading(false),
      tileerror: () => setTileLoadError(true),
    }),
    [],
  );

  return (
    <div className="delivery-map-wrapper">
      <MapContainer
        center={destination}
        zoom={16}
        scrollWheelZoom={true}
        zoomControl={false}
        fadeAnimation={false}
        zoomAnimation={false}
        className="delivery-map"
      >
        <ZoomControl position="bottomright" />
        <MapSizeObserver />
        <MapBounds
          destino={destination}
          vehiculo={vehiclePosition}
          onReady={markMapReady}
        />

        {mapReady && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            updateWhenZooming={false}
            eventHandlers={tileEventHandlers}
          />
        )}

        {/* Ubicación del destinatario */}
        <CircleMarker
          center={destination}
          radius={10}
          pathOptions={{
            color: '#ffffff',
            weight: 3,
            fillColor: '#2563eb',
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>Destinatario: {destinatario}</strong>
            <br />
            {direccion}
          </Popup>
        </CircleMarker>

        {/* Última ubicación GPS del vehículo */}
        {vehiclePosition && (
          <CircleMarker
            center={vehiclePosition}
            radius={10}
            pathOptions={{
              color: '#ffffff',
              weight: 3,
              fillColor: '#16a34a',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>Vehículo: {codigoVehiculo ?? 'Asignado'}</strong>
              <br />
              Última ubicación GPS registrada
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {tilesLoading && (
        <div className="delivery-map-status" role="status" aria-live="polite">
          <IonSpinner name="crescent" />
          <span>Cargando mapa...</span>
        </div>
      )}
      {!tilesLoading && tileLoadError && (
        <div className="delivery-map-status delivery-map-error" role="status">
          Algunos mosaicos del mapa no se pudieron cargar.
        </div>
      )}

      <div className="delivery-map-legend">
        <div>
          <span className="map-legend-dot destination-dot" />
          Destinatario
        </div>

        {vehiclePosition && (
          <div>
            <span className="map-legend-dot vehicle-dot" />
            Vehículo
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryMap;
