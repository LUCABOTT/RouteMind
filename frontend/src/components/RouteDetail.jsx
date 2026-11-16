import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from 'react-leaflet'
import L from 'leaflet'
import { formatDate } from '../utils/formDate'
import { crearIcono, obtenerDistanciaEstimadaKm } from '../utils/route'
import { AjustarMapa } from './MapHelpers'

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

function RouteDetail({
  recorrido,
  cargandoRuta,
  errorRuta,
  ruta,
  onCerrar,
}) {
  const ubicacionesGps = (recorrido.ubicacionesGps || []).filter(
    (ubicacion) =>
      Number.isFinite(Number(ubicacion.latitud)) &&
      Number.isFinite(Number(ubicacion.longitud)),
  )
  const pedidosConCoordenadas = (recorrido.pedidos || []).filter(
    (pedido) =>
      pedido.latitud != null &&
      pedido.longitud != null &&
      Number.isFinite(Number(pedido.latitud)) &&
      Number.isFinite(Number(pedido.longitud)),
  )
  const puntos = pedidosConCoordenadas.map((pedido) => [
    Number(pedido.latitud),
    Number(pedido.longitud),
  ])
  const puntosGps = ubicacionesGps.map((ubicacion) => [
    Number(ubicacion.latitud),
    Number(ubicacion.longitud),
  ])
  const puntosMapa = puntosGps.length > 0 ? puntosGps : puntos
  const paradas = recorrido.paradas || []
  const distanciaEstimada = obtenerDistanciaEstimadaKm(recorrido)
  const distanciaReal =
    recorrido.distanciaRealKm != null &&
    Number.isFinite(Number(recorrido.distanciaRealKm))
      ? Number(recorrido.distanciaRealKm)
      : null
  const duracionMovimiento =
    ubicacionesGps.length > 0
      ? `${Math.floor(Number(recorrido.tiempoMovimientoSegundos || 0) / 3600)} h ${Math.floor((Number(recorrido.tiempoMovimientoSegundos || 0) % 3600) / 60)} min`
      : 'Sin datos GPS'

  return (
    <section className="history-detail-panel">
      <div className="history-detail-header">
        <div>
          <span className="history-eyebrow">DETALLE DEL RECORRIDO</span>
          <h3>Recorrido #{recorrido.id}</h3>
          <p>
            {recorrido.vehiculo?.codigo || 'Vehículo sin código'}
            {' · '}
            {recorrido.vehiculo?.conductor || 'Sin conductor'}
          </p>
        </div>
        <button className="history-close-button" onClick={onCerrar}>
          Cerrar ×
        </button>
      </div>

      <div className="history-detail-metrics">
        <article>
          <span>Estado</span>
          <strong>
            {recorrido.estado === 'COMPLETADO' ? 'Completado' : 'En curso'}
          </strong>
        </article>
        <article>
          <span>Total de pedidos</span>
          <strong>{recorrido.totalPedidos ?? 0}</strong>
        </article>
        <article>
          <span>Distancia estimada por OSRM</span>
          <strong>
            {distanciaEstimada != null
              ? `${distanciaEstimada.toFixed(1)} km`
              : 'No disponible'}
          </strong>
        </article>
        <article>
          <span>Distancia real por GPS</span>
          <strong>
            {distanciaReal != null
              ? `${distanciaReal.toFixed(1)} km`
              : 'Pendiente de seguimiento GPS'}
          </strong>
        </article>
        <article>
          <span>Tiempo total en movimiento</span>
          <strong>{duracionMovimiento}</strong>
        </article>
        <article>
          <span>Paradas de 5 minutos o más</span>
          <strong>{paradas.length}</strong>
        </article>
        {distanciaReal != null && distanciaEstimada != null && (
          <article>
            <span>Diferencia real vs. estimada</span>
            <strong>
              {(distanciaReal - distanciaEstimada).toFixed(1)} km
            </strong>
          </article>
        )}
        <article>
          <span>Fecha de inicio</span>
          <strong>{formatDate(recorrido.fechaInicio)}</strong>
        </article>
        <article>
          <span>Fecha de finalización</span>
          <strong>
            {recorrido.fechaFin
              ? formatDate(recorrido.fechaFin)
              : 'Pendiente'}
          </strong>
        </article>
      </div>

      <div className="history-map-section">
        <div className="history-map-heading">
          <div>
            <h4>Mapa del recorrido</h4>
            <p>
              {puntosGps.length > 0
                ? 'Trayecto realizado según las ubicaciones GPS registradas'
                : 'Ubicaciones de entrega y ruta estimada por carretera'}
            </p>
          </div>
          <span className="map-tag">OpenStreetMap</span>
        </div>

        {cargandoRuta && (
          <p className="empty-state">Calculando ruta histórica...</p>
        )}
        {errorRuta && (
          <div className="message error-message">{errorRuta}</div>
        )}

        {puntosMapa.length > 0 ? (
          <div className="history-map-wrapper">
            <MapContainer
              key={`mapa-historico-${recorrido.id}`}
              center={puntosMapa[0]}
              zoom={13}
              scrollWheelZoom
              className="history-route-map"
            >
              <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
              <AjustarMapa puntos={puntosMapa} />
              {pedidosConCoordenadas.map((pedido, index) => (
                <Marker
                  key={pedido.id}
                  position={[
                    Number(pedido.latitud),
                    Number(pedido.longitud),
                  ]}
                  icon={crearIcono(L, index + 1)}
                >
                  <Popup>
                    <strong>
                      Parada {index + 1}: {pedido.destinatario}
                    </strong>
                    <br />
                    Pedido #{pedido.id}
                    <br />
                    {pedido.direccion}
                    <br />
                    Estado: {pedido.estado}
                  </Popup>
                </Marker>
              ))}
              {puntosGps.length > 0 && (
                <>
                  <Marker
                    position={puntosGps[0]}
                    icon={crearIcono(L, 'I', 'origen')}
                  >
                    <Popup>Inicio del trayecto GPS</Popup>
                  </Marker>
                  {puntosGps.length > 1 && (
                    <Marker
                      position={puntosGps[puntosGps.length - 1]}
                      icon={crearIcono(L, 'F', 'entregado')}
                    >
                      <Popup>Última ubicación GPS registrada</Popup>
                    </Marker>
                  )}
                </>
              )}
              {paradas
                .filter(
                  (parada) =>
                    parada.latitud != null &&
                    parada.longitud != null,
                )
                .map((parada, index) => (
                  <Marker
                    key={`parada-gps-${parada.llegadaEn}-${index}`}
                    position={[
                      Number(parada.latitud),
                      Number(parada.longitud),
                    ]}
                    icon={crearIcono(L, '5+', 'parada')}
                  >
                    <Popup>
                      <strong>Parada detectada</strong>
                      <br />
                      Duración: {Math.floor(parada.duracionSegundos / 60)} min
                      <br />
                      {parada.latitud}, {parada.longitud}
                    </Popup>
                  </Marker>
                ))}
              {ruta.length > 1 && (
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
          </div>
        ) : (
          <p className="empty-state">
            Este recorrido no tiene pedidos con coordenadas disponibles.
          </p>
        )}
      </div>

      {paradas.length > 0 && (
        <div className="history-detail-stops">
          <h4>Paradas de 5 minutos o más</h4>
          <div className="history-stop-list">
            {paradas.map((parada, index) => (
              <article
                className="history-stop-card"
                key={`${parada.llegadaEn}-${index}`}
              >
                <strong>
                  {parada.destinatario || `Parada ${index + 1}`}
                </strong>
                <span>
                  Duración: {Math.floor(parada.duracionSegundos / 60)} min
                  {parada.enParada ? ' · En curso' : ''}
                </span>
                <span>
                  Ubicación:{' '}
                  {parada.latitud != null && parada.longitud != null
                    ? `${Number(parada.latitud).toFixed(6)}, ${Number(parada.longitud).toFixed(6)}`
                    : 'No disponible'}
                </span>
                <small>Llegada: {formatDate(parada.llegadaEn)}</small>
                {parada.salidaEn && (
                  <small>Salida: {formatDate(parada.salidaEn)}</small>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="history-detail-orders">
        <h4>Pedidos del recorrido</h4>
        {Array.isArray(recorrido.pedidos) && recorrido.pedidos.length > 0 ? (
          <div className="history-orders-list">
            {recorrido.pedidos.map((pedido) => (
              <article className="history-order-card" key={pedido.id}>
                <div className="history-order-number">#{pedido.id}</div>
                <div className="history-order-info">
                  <strong>{pedido.destinatario}</strong>
                  <p>{pedido.direccion}</p>
                  <small>Prioridad: {pedido.prioridad}</small>
                </div>
                <span
                  className={`history-status history-status-${(
                    pedido.estado || ''
                  ).toLowerCase()}`}
                >
                  {pedido.estado === 'ENTREGADO'
                    ? 'Entregado'
                    : pedido.estado === 'EN_CAMINO'
                      ? 'En camino'
                      : pedido.estado}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Este recorrido no tiene pedidos asociados.
          </p>
        )}
      </div>
    </section>
  )
}

export default RouteDetail
