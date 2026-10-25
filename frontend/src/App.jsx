
import { useCallback, useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const API_URL = 'http://localhost:3000/api'
const MAP_CENTER = [14.0723, -87.1921]

const crearIcono = (numero, tipo = 'parada') =>
  L.divIcon({
    className: 'route-marker-container',
    html: `<div class="route-marker ${tipo}">${numero}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })

function AjustarMapa({ puntos }) {
  const map = useMap()

  useEffect(() => {
    if (puntos.length === 1) {
      map.setView(puntos[0], 15)
    } else if (puntos.length > 1) {
      map.fitBounds(puntos, { padding: [45, 45], maxZoom: 15 })
    }
  }, [map, puntos])

  return null
}

function App() {
  const [vehiculos, setVehiculos] = useState([])
  const [vehiculoId, setVehiculoId] = useState('')
  const [planificacion, setPlanificacion] = useState(null)
  const [ruta, setRuta] = useState(null)
  const [resumenRuta, setResumenRuta] = useState(null)
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true)
  const [cargandoRuta, setCargandoRuta] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    async function cargarVehiculos() {
      try {
        const response = await fetch(`${API_URL}/vehiculos`)
        if (!response.ok) throw new Error('No se pudieron cargar los vehículos.')

        const data = await response.json()
        const lista = Array.isArray(data) ? data : data.data

        if (!Array.isArray(lista)) {
          throw new Error('La API de vehículos devolvió un formato inesperado.')
        }

        setVehiculos(lista)

        if (lista.length > 0) {
          setVehiculoId(String(lista[0].id))
        } else {
          setAviso('Todavía no hay vehículos registrados.')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setCargandoVehiculos(false)
      }
    }

    cargarVehiculos()
  }, [])

  const planificar = useCallback(async () => {
    if (!vehiculoId) {
      setError('Selecciona un vehículo.')
      return
    }

    setCargandoRuta(true)
    setError('')
    setAviso('')
    setPlanificacion(null)
    setRuta(null)
    setResumenRuta(null)

    try {
      const response = await fetch(
        `${API_URL}/pedidos/vehiculo/${vehiculoId}/planificar`,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo planificar la ruta.')
      }

      setPlanificacion(data)

      if (!data.paradas?.length) {
        setAviso('Este vehículo no tiene pedidos pendientes de entrega.')
        return
      }

      const origen = data.origen
        ? [Number(data.origen.latitud), Number(data.origen.longitud)]
        : null

      const paradas = data.paradas.map((parada) => [
        Number(parada.latitud),
        Number(parada.longitud),
      ])

      const coordenadas = [...(origen ? [origen] : []), ...paradas]

      if (coordenadas.length < 2) {
        setAviso('Se necesita un origen y al menos una parada para calcular el recorrido por carretera.')
        return
      }

      const coordenadasOSRM = coordenadas
        .map(([lat, lon]) => `${lon},${lat}`)
        .join(';')

      const urlOSRM =
        `https://router.project-osrm.org/route/v1/driving/${coordenadasOSRM}` +
        '?overview=full&geometries=geojson&steps=false'

      const routeResponse = await fetch(urlOSRM)
      if (!routeResponse.ok) {
        throw new Error('No fue posible consultar el servicio de rutas.')
      }

      const routeData = await routeResponse.json()

      if (routeData.code !== 'Ok' || !routeData.routes?.length) {
        throw new Error('El servicio no encontró un recorrido por carretera para estas ubicaciones.')
      }

      const recorrido = routeData.routes[0]

      setRuta(
        recorrido.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      )

      setResumenRuta({
        distanciaKm: recorrido.distance / 1000,
        duracionMinutos: recorrido.duration / 60,
      })
    } catch (err) {
      setError(err.message || 'Ocurrió un error al planificar.')
    } finally {
      setCargandoRuta(false)
    }
  }, [vehiculoId])

  useEffect(() => {
    if (vehiculoId) planificar()
  }, [vehiculoId, planificar])

  const puntosMapa = [
    ...(planificacion?.origen
      ? [[
          Number(planificacion.origen.latitud),
          Number(planificacion.origen.longitud),
        ]]
      : []),
    ...(planificacion?.paradas || []).map((parada) => [
      Number(parada.latitud),
      Number(parada.longitud),
    ]),
  ]

  const paradas = planificacion?.paradas || []

  return (
    <main className="route-app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h1>RouteMind</h1>
            <p>Planificación logística inteligente</p>
          </div>
        </div>
        <span className="system-status">
          <span /> Sistema de rutas
        </span>
      </header>

      <section className="page-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">OPERACIONES LOGÍSTICAS</span>
            <h2>Planificador de rutas</h2>
            <p>Organiza las entregas y visualiza el recorrido de cada vehículo.</p>
          </div>

          <button
            className="refresh-button"
            onClick={planificar}
            disabled={cargandoRuta || !vehiculoId}
          >
            {cargandoRuta ? 'Calculando...' : '↻ Recalcular ruta'}
          </button>
        </div>

        <section className="metrics">
          <article className="metric-card">
            <span className="metric-label">Vehículo seleccionado</span>
            <strong>{planificacion?.vehiculo?.codigo || '—'}</strong>
            <small>{planificacion?.vehiculo?.conductor || 'Selecciona un vehículo'}</small>
          </article>

          <article className="metric-card">
            <span className="metric-label">Paradas pendientes</span>
            <strong>{planificacion?.totalParadas ?? '—'}</strong>
            <small>Entregas por realizar</small>
          </article>

          <article className="metric-card">
            <span className="metric-label">Distancia por carretera</span>
            <strong>
              {resumenRuta ? `${resumenRuta.distanciaKm.toFixed(1)} km` : '—'}
            </strong>
            <small>
              {planificacion?.distanciaTotalKm != null
                ? `Línea recta: ${planificacion.distanciaTotalKm} km`
                : 'Distancia del recorrido'}
            </small>
          </article>

          <article className="metric-card">
            <span className="metric-label">Duración estimada</span>
            <strong>
              {resumenRuta
                ? `${Math.round(resumenRuta.duracionMinutos)} min`
                : '—'}
            </strong>
            <small>No incluye tiempo de entrega ni tráfico en vivo</small>
          </article>
        </section>

        <section className="planner-layout">
          <aside className="route-sidebar">
            <div className="sidebar-heading">
              <div>
                <h3>Tu planificación</h3>
                <p>Selecciona el vehículo y revisa las paradas.</p>
              </div>
            </div>

            <label className="field-label" htmlFor="vehiculo">
              Vehículo
            </label>
            <select
              id="vehiculo"
              value={vehiculoId}
              onChange={(event) => setVehiculoId(event.target.value)}
              disabled={cargandoVehiculos || vehiculos.length === 0}
            >
              <option value="">
                {cargandoVehiculos ? 'Cargando vehículos...' : 'Seleccionar vehículo'}
              </option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.codigo} — {vehiculo.conductor}
                </option>
              ))}
            </select>

            {error && <div className="message error-message">{error}</div>}
            {aviso && !error && <div className="message">{aviso}</div>}

            <div className="stops-heading">
              <h3>Secuencia de entregas</h3>
              <span>{paradas.length}</span>
            </div>

            <div className="stops-list">
              {planificacion?.origen && (
                <div className="stop-item origin-item">
                  <div className="stop-number origin-number">V</div>
                  <div className="stop-info">
                    <strong>Inicio del recorrido</strong>
                    <p>Ubicación actual del vehículo</p>
                  </div>
                </div>
              )}

              {paradas.map((parada) => (
                <div className="stop-item" key={parada.pedidoId}>
                  <div className="stop-number">{parada.orden}</div>
                  <div className="stop-info">
                    <div className="stop-title-row">
                      <strong>{parada.destinatario}</strong>
                      <span className={`priority priority-${parada.prioridad.toLowerCase()}`}>
                        {parada.prioridad}
                      </span>
                    </div>
                    <p>{parada.direccion}</p>
                    <small>Pedido #{parada.pedidoId}</small>
                  </div>
                </div>
              ))}

              {!cargandoRuta && planificacion && paradas.length === 0 && (
                <p className="empty-state">No hay entregas pendientes para este vehículo.</p>
              )}

              {!planificacion && !error && (
                <p className="empty-state">
                  {cargandoRuta ? 'Preparando planificación...' : 'Selecciona un vehículo para consultar sus entregas.'}
                </p>
              )}
            </div>
          </aside>

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
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <AjustarMapa puntos={puntosMapa} />

                {planificacion?.origen && (
                  <Marker
                    position={[
                      Number(planificacion.origen.latitud),
                      Number(planificacion.origen.longitud),
                    ]}
                    icon={crearIcono('V', 'origen')}
                  >
                    <Popup>Inicio: ubicación del vehículo</Popup>
                  </Marker>
                )}

                {paradas.map((parada) => (
                  <Marker
                    key={parada.pedidoId}
                    position={[
                      Number(parada.latitud),
                      Number(parada.longitud),
                    ]}
                    icon={crearIcono(parada.orden)}
                  >
                    <Popup>
                      <strong>Parada {parada.orden}: {parada.destinatario}</strong>
                      <br />
                      {parada.direccion}
                      <br />
                      Prioridad: {parada.prioridad}
                    </Popup>
                  </Marker>
                ))}

                {ruta && <Polyline positions={ruta} pathOptions={{ color: '#A1195C', weight: 5, opacity: 0.85 }} />}
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
              <span><i className="legend-stop" /> Entregas</span>
              <span><i className="legend-route" /> Ruta por carretera</span>
            </div>
          </section>
        </section>

        <footer className="page-footer">
          RouteMind · Planificación logística · Las distancias y tiempos son estimaciones.
        </footer>
      </section>
    </main>
  )
}

export default App
