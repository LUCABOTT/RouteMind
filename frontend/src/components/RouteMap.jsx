import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from 'react-leaflet'
import L from 'leaflet'
import { AjustarMapa } from './MapHelpers'
import { crearIcono } from '../utils/route'

const MAP_CENTER = [14.0723, -87.1921]
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export default function RouteMap({
  puntosMapa,
  planificacion,
  paradas,
  entregados,
  ruta,
  cargandoRuta,
  liveTracking,
  gpsStale,
}) {
  return (
    <section className="map-panel">
      <div className="map-heading">
        <div>
          <h3>Mapa de entregas</h3>
          <p>Visualización geográfica del recorrido planificado</p>
        </div>
        <span className="map-tag">OpenStreetMap</span>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={puntosMapa[0] || MAP_CENTER}
          zoom={12}
          scrollWheelZoom
          className="route-map"
        >
          <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
          <AjustarMapa puntos={puntosMapa} />

          {planificacion?.origen && (
            <Marker
              position={[
                Number(planificacion.origen.latitud),
                Number(planificacion.origen.longitud),
              ]}
              icon={crearIcono(L, 'V', 'origen')}
            >
              <Popup>Inicio: ubicación del vehículo</Popup>
            </Marker>
          )}

          {liveTracking?.latitud != null && liveTracking?.longitud != null && (
            <Marker
              position={[
                Number(liveTracking.latitud),
                Number(liveTracking.longitud),
              ]}
              icon={L.divIcon({
                className: `gps-marker ${gpsStale ? 'gps-marker-stale' : ''}`,
                html: '<span>●</span>',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
            >
              <Popup>
                <strong>Ubicación GPS · {liveTracking.codigo}</strong>
                <br />
                {liveTracking.actualizadoEn
                  ? new Date(liveTracking.actualizadoEn).toLocaleString()
                  : 'Sin fecha de actualización'}
              </Popup>
            </Marker>
          )}

          {paradas.map((parada) => (
            <Marker
              key={parada.pedidoId}
              position={[Number(parada.latitud), Number(parada.longitud)]}
              icon={crearIcono(L, parada.orden)}
            >
              <Popup>
                <strong>
                  Parada {parada.orden}: {parada.destinatario}
                </strong>
                <br />
                {parada.direccion}
                <br />
                Prioridad: {parada.prioridad}
                <br />
                Estado: {parada.estado}
              </Popup>
            </Marker>
          ))}

          {entregados
            .filter(
              (pedido) =>
                pedido.latitud != null && pedido.longitud != null,
            )
            .map((pedido) => (
              <Marker
                key={`entregado-${pedido.id}`}
                position={[
                  Number(pedido.latitud),
                  Number(pedido.longitud),
                ]}
                icon={crearIcono(L, '✓', 'entregado')}
              >
                <Popup>
                  <strong>✓ {pedido.destinatario}</strong>
                  <br />
                  {pedido.direccion}
                  <br />
                  Estado: ENTREGADO
                </Popup>
              </Marker>
            ))}

          {ruta && (
            <Polyline
              positions={ruta}
              pathOptions={{
                color: '#A1195C',
                weight: 5,
                opacity: 0.85,
              }}
            />
          )}
        </MapContainer>

        {cargandoRuta && (
          <div className="map-loading">Calculando recorrido...</div>
        )}

        {!cargandoRuta && puntosMapa.length === 0 && (
          <div className="map-empty">
            <span>⌖</span>
            <strong>Tu mapa aparecerá aquí</strong>
            <p>Selecciona un vehículo con pedidos asignados.</p>
          </div>
        )}
      </div>

      <div className="map-footer">
        <span><i className="legend-origin" /> Inicio</span>
        <span><i className="legend-stop" /> Pendientes</span>
        <span><i className="legend-completed" /> Entregados</span>
        <span><i className="legend-route" /> Ruta por carretera</span>
      </div>
    </section>
  )
}
