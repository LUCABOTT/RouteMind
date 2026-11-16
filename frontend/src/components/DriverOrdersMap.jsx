import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { AjustarMapa } from './MapHelpers'
import { crearIcono } from '../utils/route'

const MAP_CENTER = [14.0723, -87.1921]
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

export default function DriverOrdersMap({ pedidos }) {
  const pedidosConUbicacion = useMemo(
    () =>
      pedidos.filter((pedido) => {
        const latitud = Number(pedido.latitud)
        const longitud = Number(pedido.longitud)
        return (
          pedido.latitud != null &&
          pedido.longitud != null &&
          Number.isFinite(latitud) &&
          Number.isFinite(longitud) &&
          latitud >= -90 &&
          latitud <= 90 &&
          longitud >= -180 &&
          longitud <= 180
        )
      }),
    [pedidos],
  )
  const puntos = useMemo(
    () =>
      pedidosConUbicacion.map((pedido) => [
        Number(pedido.latitud),
        Number(pedido.longitud),
      ]),
    [pedidosConUbicacion],
  )

  return (
    <section className="driver-orders-map">
      <div className="driver-orders-map-heading">
        <div>
          <h4>Ubicación de tus pedidos</h4>
          <p>Toca un marcador para ver los detalles de entrega.</p>
        </div>
        <span>OpenStreetMap</span>
      </div>
      <div className="driver-orders-map-wrapper">
        <MapContainer
          center={puntos[0] || MAP_CENTER}
          zoom={12}
          scrollWheelZoom
          className="route-map"
        >
          <TileLayer attribution={ATTRIBUTION} url={TILE_URL} />
          <AjustarMapa puntos={puntos} />
          {pedidosConUbicacion.map((pedido, index) => (
            <Marker
              key={pedido.id}
              position={[Number(pedido.latitud), Number(pedido.longitud)]}
              icon={crearIcono(
                L,
                pedido.estado === 'ENTREGADO' ? '✓' : index + 1,
                pedido.estado === 'ENTREGADO' ? 'entregado' : 'parada',
              )}
            >
              <Popup>
                <strong>
                  {pedido.destinatario} · Pedido #{pedido.id}
                </strong>
                <br />
                {pedido.direccion}
                <br />
                Estado: {pedido.estado}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        {puntos.length === 0 && (
          <div className="driver-orders-map-empty">
            No hay ubicaciones disponibles para los pedidos asignados.
          </div>
        )}
      </div>
      <div className="driver-orders-map-legend">
        <span><i className="legend-stop" /> Pendientes</span>
        <span><i className="legend-completed" /> Entregados</span>
      </div>
    </section>
  )
}
