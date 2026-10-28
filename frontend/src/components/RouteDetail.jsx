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
  const distanciaEstimada = obtenerDistanciaEstimadaKm(recorrido)
  const distanciaReal =
    recorrido.distanciaRealKm != null &&
    Number.isFinite(Number(recorrido.distanciaRealKm))
      ? Number(recorrido.distanciaRealKm)
      : null

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
            <p>Ubicaciones de entrega y ruta estimada por carretera</p>
          </div>
          <span className="map-tag">OpenStreetMap</span>
        </div>

        {cargandoRuta && (
          <p className="empty-state">Calculando ruta histórica...</p>
        )}
        {errorRuta && (
          <div className="message error-message">{errorRuta}</div>
        )}

        {puntos.length > 0 ? (
          <div className="history-map-wrapper">
            <MapContainer
              key={`mapa-historico-${recorrido.id}`}
              center={puntos[0]}
              zoom={13}
              scrollWheelZoom
              className="history-route-map"
            >
              <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
              <AjustarMapa puntos={puntos} />
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
