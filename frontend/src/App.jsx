
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HistorySection from './components/HistorySection'
import RouteDetail from './components/RouteDetail'
import RouteMap from './components/RouteMap'
import AuthPage from './components/AuthPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './auth/useAuth'
import { apiFetch } from './utils/api'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminDashboard from './components/AdminDashboard'
import DriverPage from './components/DriverPage'
import Sidebar from './components/Sidebar'
import 'leaflet/dist/leaflet.css'
import './App.css'

function formatElapsed(seconds) {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`
}

function PlannerPage() {
  const { user, logout } = useAuth()
  const [vehiculos, setVehiculos] = useState([])
  const [vehiculoId, setVehiculoId] = useState('')
  const [planificacion, setPlanificacion] = useState(null)
  const [pedidosVehiculo, setPedidosVehiculo] = useState([])
  const [ruta, setRuta] = useState(null)
  const [resumenRuta, setResumenRuta] = useState(null)
  const [cargandoVehiculos, setCargandoVehiculos] = useState(true)
  const [cargandoRuta, setCargandoRuta] = useState(false)
  const [entregandoId, setEntregandoId] = useState(null)
  const [error, setError] = useState('')
  const [liveTracking, setLiveTracking] = useState(null)
  const [trackingError, setTrackingError] = useState('')
  const [clockNow, setClockNow] = useState(0)
  const [aviso, setAviso] = useState('')
  const [iniciandoRecorrido, setIniciandoRecorrido] = useState(false)
  const [historialRecorridos, setHistorialRecorridos] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState('')
  const [recorridoSeleccionado, setRecorridoSeleccionado] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')
  const [rutaHistorica, setRutaHistorica] = useState([])
const [cargandoRutaHistorica, setCargandoRutaHistorica] = useState(false)
const [errorRutaHistorica, setErrorRutaHistorica] = useState('')
  const detalleRecorridoRef = useRef(null)

  useEffect(() => {
    if (recorridoSeleccionado) {
      detalleRecorridoRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [recorridoSeleccionado])

useEffect(() => {
  if (!vehiculoId) {
    queueMicrotask(() => {
      setLiveTracking(null)
      setTrackingError('')
    })
    return undefined
  }

  let active = true
  const refreshTracking = async () => {
    try {
      const response = await apiFetch(`/seguimiento/vehiculos/${vehiculoId}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo consultar el GPS del vehículo.')
      }
      if (active) {
        setLiveTracking(data)
        setTrackingError('')
      }
    } catch (trackingLoadError) {
      if (active) setTrackingError(trackingLoadError.message)
    }
  }

  queueMicrotask(() => void refreshTracking())
  const timer = window.setInterval(() => void refreshTracking(), 10000)
  return () => {
    active = false
    window.clearInterval(timer)
  }
}, [vehiculoId])

useEffect(() => {
  const timer = window.setInterval(() => setClockNow(Date.now()), 10000)
  return () => window.clearInterval(timer)
}, [])

const gpsStale =
  !liveTracking?.actualizadoEn ||
  clockNow - new Date(liveTracking.actualizadoEn).getTime() > 45000

  const paradas = useMemo(
    () => planificacion?.paradas || [],
    [planificacion],
  )

  // Pedidos activos y completados del vehículo seleccionado.
  const pedidosContabilizados = pedidosVehiculo.filter(
    (pedido) =>
      ['ASIGNADO', 'EN_CAMINO', 'ENTREGADO'].includes(pedido.estado),
  )

  const totalEntregas = pedidosContabilizados.length

  const entregasCompletadas = pedidosContabilizados.filter(
    (pedido) => pedido.estado === 'ENTREGADO',
  ).length

  const porcentajeCompletado =
    totalEntregas > 0
      ? Math.round((entregasCompletadas / totalEntregas) * 100)
      : 0

  const entregados = pedidosVehiculo.filter(
    (pedido) => pedido.estado === 'ENTREGADO',
  )

  const pedidosAsignados = pedidosVehiculo.filter(
  (pedido) => pedido.estado === 'ASIGNADO',
)

const pedidosEnCamino = pedidosVehiculo.filter(
  (pedido) => pedido.estado === 'EN_CAMINO',
)

  useEffect(() => {
    async function cargarVehiculos() {
      try {
        const response = await apiFetch('/vehiculos')

        if (!response.ok) {
          throw new Error('No se pudieron cargar los vehículos.')
        }

        const data = await response.json()
        const lista = Array.isArray(data) ? data : data.data

        if (!Array.isArray(lista)) {
          throw new Error(
            'La API de vehículos devolvió un formato inesperado.',
          )
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

  // Consulta todos los pedidos para calcular el progreso,
  // incluyendo los que ya están entregados.
  const cargarPedidosVehiculo = useCallback(async () => {
    if (!vehiculoId) {
      setPedidosVehiculo([])
      return
    }

    const response = await apiFetch('/pedidos')

    if (!response.ok) {
      throw new Error('No se pudieron consultar los pedidos.')
    }

    const data = await response.json()
    const lista = Array.isArray(data) ? data : data.data

    if (!Array.isArray(lista)) {
      throw new Error('La API de pedidos devolvió un formato inesperado.')
    }

    setPedidosVehiculo(
      lista.filter(
        (pedido) => Number(pedido.vehiculoId) === Number(vehiculoId),
      ),
    )
  }, [vehiculoId])

  const cargarHistorialRecorridos = useCallback(async () => {
    setCargandoHistorial(true)
    setErrorHistorial('')

    try {
      const response = await apiFetch('/recorridos')

      if (!response.ok) {
        throw new Error('No se pudo cargar el historial de recorridos.')
      }

      const data = await response.json()
      const lista = Array.isArray(data) ? data : data.data

      if (!Array.isArray(lista)) {
        throw new Error('La API de recorridos devolvió un formato inesperado.')
      }

      setHistorialRecorridos(lista)
    } catch (err) {
      setErrorHistorial(err.message || 'No se pudo cargar el historial.')
    } finally {
      setCargandoHistorial(false)
    }
  }, [])

  const verDetalleRecorrido = async (recorridoId) => {
    setCargandoDetalle(true)
    setErrorDetalle('')
    setErrorRutaHistorica('')
    setRutaHistorica([])
    setRecorridoSeleccionado(null)

    try {
      const response = await apiFetch(`/recorridos/${recorridoId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'No se pudo cargar el detalle del recorrido.',
        )
      }

      setRecorridoSeleccionado(data)
      setCargandoDetalle(false)

      const coordenadas = (data.pedidos || [])
        .filter(
          (pedido) =>
            pedido.latitud != null &&
            pedido.longitud != null &&
            Number.isFinite(Number(pedido.latitud)) &&
            Number.isFinite(Number(pedido.longitud)),
        )
        .map((pedido) => [
          Number(pedido.longitud),
          Number(pedido.latitud),
        ])

      if (coordenadas.length < 2) {
        setErrorRutaHistorica(
          'Se necesitan al menos dos pedidos con coordenadas para dibujar la ruta.',
        )
        return
      }

      setCargandoRutaHistorica(true)

      try {
        const coordenadasOSRM = coordenadas
          .map(([lon, lat]) => `${lon},${lat}`)
          .join(';')

        const urlOSRM =
          `https://router.project-osrm.org/route/v1/driving/${coordenadasOSRM}` +
          '?overview=full&geometries=geojson&steps=false'

        const routeResponse = await fetch(urlOSRM)
        const routeData = await routeResponse.json()

        if (!routeResponse.ok || routeData.code !== 'Ok' ||
            !routeData.routes?.length) {
          throw new Error('OSRM no encontró una ruta para estas ubicaciones.')
        }

        setRutaHistorica(
          routeData.routes[0].geometry.coordinates.map(
            ([lon, lat]) => [lat, lon],
          ),
        )
      } catch (err) {
        setErrorRutaHistorica(
          err.message || 'No se pudo calcular la ruta histórica.',
        )
      } finally {
        setCargandoRutaHistorica(false)
      }
    } catch (err) {
      setErrorDetalle(
        err.message || 'Ocurrió un error al consultar el recorrido.',
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

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
      await cargarHistorialRecorridos()

      const response = await apiFetch(
        `/pedidos/vehiculo/${vehiculoId}/planificar`,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'No se pudo planificar la ruta.',
        )
      }

      setPlanificacion(data)

      // Actualizar el progreso con los estados guardados en la base de datos.
      await cargarPedidosVehiculo()

      if (!data.paradas?.length) {
        setAviso('No hay entregas pendientes para este vehículo.')
        return
      }

      const origen = data.origen
        ? [
            Number(data.origen.latitud),
            Number(data.origen.longitud),
          ]
        : null

      const coordenadasParadas = data.paradas.map((parada) => [
        Number(parada.latitud),
        Number(parada.longitud),
      ])

      const coordenadas = [
        ...(origen ? [origen] : []),
        ...coordenadasParadas,
      ]

      if (coordenadas.length < 2) {
        setAviso(
          'Se necesita un origen y al menos una parada para calcular el recorrido por carretera.',
        )
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
        throw new Error(
          'El servicio no encontró un recorrido por carretera para estas ubicaciones.',
        )
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
      setError(
        Array.isArray(err.message)
          ? err.message.join(', ')
          : err.message || 'Ocurrió un error al planificar.',
      )
    } finally {
      setCargandoRuta(false)
    }
  }, [vehiculoId, cargarPedidosVehiculo, cargarHistorialRecorridos])

  useEffect(() => {
    if (vehiculoId) {
      queueMicrotask(() => {
        void planificar()
      })
    } else {
      queueMicrotask(() => {
        setPlanificacion(null)
        setPedidosVehiculo([])
        setRuta(null)
        setResumenRuta(null)
      })
    }
  }, [vehiculoId, planificar])

  // Marca el pedido en el backend y vuelve a consultar la ruta.
  const marcarEntregado = async (pedidoId) => {
    setEntregandoId(pedidoId)
    setError('')
    setAviso('')

    try {
      const response = await apiFetch(
        `/pedidos/${pedidoId}/entregar`,
        { method: 'PATCH' },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'No se pudo completar la entrega.',
        )
      }

      await planificar()

      setAviso(`El pedido #${pedidoId} se marcó como entregado.`)
    } catch (err) {
      setError(err.message || 'No se pudo completar la entrega.')
    } finally {
      setEntregandoId(null)
    }
  }


const iniciarRecorrido = async () => {
  if (!vehiculoId) {
    setError('Selecciona un vehículo.')
    return
  }

  if (pedidosAsignados.length === 0) {
    setError('Este vehículo no tiene pedidos asignados para iniciar.')
    return
  }

  setIniciandoRecorrido(true)
  setError('')
  setAviso('')

  try {
    const response = await apiFetch(
      `/pedidos/vehiculo/${vehiculoId}/iniciar`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distanciaEstimadaKm: resumenRuta?.distanciaKm ?? null,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'No se pudo iniciar el recorrido.',
      )
    }
    await planificar()
    await planificar()

    setAviso(
      data.mensaje || 'El recorrido se inició correctamente.',
    )
  } catch (err) {
    setError(err.message || 'Ocurrió un error al iniciar el recorrido.')
  } finally {
    setIniciandoRecorrido(false)
  }
}



  // Incluimos las entregas completadas en el mapa,
  // pero no en la ruta pendiente que calcula OSRM.
  const puntosMapa = useMemo(
    () => [
      ...(planificacion?.origen
        ? [[
            Number(planificacion.origen.latitud),
            Number(planificacion.origen.longitud),
          ]]
        : []),
      ...paradas.map((parada) => [
        Number(parada.latitud),
        Number(parada.longitud),
      ]),
      ...entregados
        .filter(
          (pedido) =>
            pedido.latitud != null && pedido.longitud != null,
        )
        .map((pedido) => [
          Number(pedido.latitud),
          Number(pedido.longitud),
        ]),
      ...(liveTracking?.latitud != null && liveTracking?.longitud != null
        ? [[Number(liveTracking.latitud), Number(liveTracking.longitud)]]
        : []),
    ],
    [planificacion, paradas, entregados, liveTracking],
  )

  const handleLogout = async () => {
    try {
      await logout()
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  return (
    <main className="route-app">
      <Sidebar user={user} onLogout={handleLogout} />

      <section className="page-content" id="overview">
        <div className="page-heading">
          <div>
            <span className="eyebrow">OPERACIONES LOGÍSTICAS</span>
            <h2>Route Optimizer</h2>
            <p>
              Organiza las entregas y visualiza el recorrido de cada vehículo.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={planificar}
            disabled={cargandoRuta || entregandoId !== null || !vehiculoId}
          >
            {cargandoRuta ? 'Calculando...' : '↻ Recalcular ruta'}
          </button>
        </div>

        <section className="planner-layout">
          <div className="planner-left-column">
        <section className="metrics">
          <article className="metric-card">
            <span className="metric-label">Vehículo seleccionado</span>
            <strong>{planificacion?.vehiculo?.codigo || '—'}</strong>
            <small>
              Conductor: {planificacion?.vehiculo?.conductor || 'Sin asignar'}
            </small>
            {planificacion?.vehiculo?.estado && (
              <span
                className={`vehicle-status vehicle-status-${planificacion.vehiculo.estado.toLowerCase()}`}
              >
                {planificacion.vehiculo.estado === 'EN_RUTA'
                  ? '● En ruta'
                  : planificacion.vehiculo.estado === 'MANTENIMIENTO'
                    ? '● En mantenimiento'
                    : '● Disponible'}
              </span>
            )}
          </article>

          <article className="metric-card">
            <span className="metric-label">Paradas pendientes</span>
            <strong>{paradas.length}</strong>
            <small>Entregas por realizar</small>
          </article>

          <article className="metric-card">
            <span className="metric-label">Distancia por carretera</span>
            <strong>
              {resumenRuta
                ? `${resumenRuta.distanciaKm.toFixed(1)} km`
                : '—'}
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

        <section className="progress-card">
          <div className="progress-top">
            <div>
              <h3>Progreso de entregas</h3>
              <p>
                {entregasCompletadas} de {totalEntregas} entregas completadas
              </p>
            </div>
            <strong className="progress-percent">
              {porcentajeCompletado}%
            </strong>
          </div>

          <div
            className="progress-track"
            role="progressbar"
            aria-label="Progreso de entregas"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={porcentajeCompletado}
          >
            <div
              className="progress-fill"
              style={{ width: `${porcentajeCompletado}%` }}
            />
          </div>

          {totalEntregas > 0 && entregasCompletadas === totalEntregas && (
            <p className="all-delivered">
              <span>✓</span> Todas las entregas de este vehículo están completadas.
            </p>
          )}
        </section>

        {(trackingError || liveTracking?.latitud != null) && (
          <section className="live-tracking-card">
            <div>
              <span className="eyebrow">GPS DEL CONDUCTOR</span>
              {trackingError ? (
                <p className="error-text">{trackingError}</p>
              ) : liveTracking?.latitud != null ? (
                <>
                  <strong>{liveTracking.codigo} · ubicación actual</strong>
                  <p>
                    {gpsStale
                      ? 'GPS desactualizado · '
                      : 'GPS en vivo · '}
                    Última actualización:{' '}
                    {liveTracking.actualizadoEn
                      ? new Date(liveTracking.actualizadoEn).toLocaleString()
                      : 'sin fecha'}
                  </p>
                </>
              ) : (
                <p>El conductor aún no ha compartido una ubicación GPS.</p>
              )}
            </div>
            {liveTracking?.paradas?.filter((stop) => stop.enParada).map((stop) => (
              <div className="live-stop" key={`${stop.pedidoId}-${stop.llegadaEn}`}>
                <strong>En parada: {stop.destinatario}</strong>
                <span>{formatElapsed(stop.duracionSegundos)}</span>
              </div>
            ))}
          </section>
        )}

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
              disabled={cargandoVehiculos || vehiculos.length === 0 || entregandoId !== null}
            >
              <option value="">
                {cargandoVehiculos
                  ? 'Cargando vehículos...'
                  : 'Seleccionar vehículo'}
              </option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.codigo} — {vehiculo.conductor}
                </option>
              ))}
            </select>

{user?.role !== 'VIEWER' && pedidosAsignados.length > 0 && (
  <button
    className="start-route-button"
    onClick={iniciarRecorrido}
    disabled={
      iniciandoRecorrido ||
      cargandoRuta ||
      entregandoId !== null
    }
  >
    {iniciandoRecorrido
      ? 'Iniciando recorrido...'
      : `▶ Iniciar recorrido (${pedidosAsignados.length} pedidos)`}
  </button>
)}

{pedidosEnCamino.length > 0 && (
  <div className="route-running-notice">
    <span className="route-running-dot" />
    Recorrido en curso · {pedidosEnCamino.length} pedidos en camino
  </div>
)}


            {error && (
              <div className="message error-message">{error}</div>
            )}
            {aviso && !error && (
              <div className="message">{aviso}</div>
            )}

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
                      <span
                        className={`priority priority-${parada.prioridad.toLowerCase()}`}
                      >
                        {parada.prioridad}
                      </span>
                    </div>

                    <p>{parada.direccion}</p>
                    <small>
                      Pedido #{parada.pedidoId} · {parada.estado}
                    </small>

                    {user?.role !== 'VIEWER' && <button
                      className="deliver-button"
                      onClick={() => marcarEntregado(parada.pedidoId)}
                      disabled={entregandoId !== null || cargandoRuta}
                    >
                      {entregandoId === parada.pedidoId
                        ? 'Guardando entrega...'
                        : '✓ Marcar como entregado'}
                    </button>}
                  </div>
                </div>
              ))}

              {entregados.length > 0 && (
                <div className="completed-section">
                  <h4>Entregas completadas</h4>

                  {entregados.map((pedido) => (
                    <div className="stop-item completed-item" key={pedido.id}>
                      <div className="stop-number completed-number">✓</div>
                      <div className="stop-info">
                        <strong>{pedido.destinatario}</strong>
                        <p>{pedido.direccion}</p>
                        <small>Pedido #{pedido.id} · ENTREGADO</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!cargandoRuta && planificacion && paradas.length === 0 && (
                <p className="empty-state">
                  No hay entregas pendientes para este vehículo.
                </p>
              )}

              {!planificacion && !error && (
                <p className="empty-state">
                  {cargandoRuta
                    ? 'Preparando planificación...'
                    : 'Selecciona un vehículo para consultar sus entregas.'}
                </p>
              )}
            </div>
          </aside>
          </div>
          <div className="planner-right-column">
          <RouteMap
            puntosMapa={puntosMapa}
            planificacion={planificacion}
            paradas={paradas}
            entregados={entregados}
            ruta={ruta}
            cargandoRuta={cargandoRuta}
            liveTracking={liveTracking}
            gpsStale={gpsStale}
          />
          <section className="route-overview-card">
            <div className="route-overview-heading">
              <h3>Route Overview</h3>
              <span>Current route</span>
            </div>
            <div className="route-overview-content">
              <div className="route-overview-stats">
                <div><span>Stops</span><strong>{paradas.length}</strong></div>
                <div><span>Total distance</span><strong>{resumenRuta ? `${resumenRuta.distanciaKm.toFixed(1)} km` : '—'}</strong></div>
                <div><span>Estimated time</span><strong>{resumenRuta ? formatElapsed(Math.round(resumenRuta.duracionMinutos * 60)) : '—'}</strong></div>
                <div><span>Delivery progress</span><strong>{porcentajeCompletado}%</strong></div>
              </div>
              <div className="route-overview-ring" style={{ '--progress': `${porcentajeCompletado}%` }}>
                <div><strong>{paradas.length}</strong><span>Stops</span></div>
              </div>
            </div>
            <small>Distance and time are estimates based on current route conditions.</small>
          </section>
          </div>
        </section>

        <HistorySection
          historialRecorridos={historialRecorridos}
          vehiculos={vehiculos}
          vehiculoId={vehiculoId}
          cargandoHistorial={cargandoHistorial}
          errorHistorial={errorHistorial}
          onVerDetalle={verDetalleRecorrido}
          cargandoDetalle={cargandoDetalle}
          cargandoRutaHistorica={cargandoRutaHistorica}
        />

        {(cargandoDetalle || errorDetalle || recorridoSeleccionado) && (
          <div
            ref={detalleRecorridoRef}
            className="history-detail-anchor"
          >
            {cargandoDetalle && (
              <div className="history-detail-panel">
                <p className="empty-state">
                  Cargando detalle del recorrido...
                </p>
              </div>
            )}

            {errorDetalle && (
              <div className="message error-message">{errorDetalle}</div>
            )}

            {recorridoSeleccionado && (
              <RouteDetail
                recorrido={recorridoSeleccionado}
                cargandoRuta={cargandoRutaHistorica}
                errorRuta={errorRutaHistorica}
                ruta={rutaHistorica}
                onCerrar={() => {
                  setRecorridoSeleccionado(null)
                  setErrorDetalle('')
                }}
              />
            )}
          </div>
        )}

        <footer className="page-footer">
          RouteMind · Planificación logística · Las distancias y tiempos son estimaciones.
        </footer>
      </section>
    </main>
  )
}

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <main className="auth-loading">Verificando sesión...</main>
  if (!user) return <Navigate to="/login" replace />
  return (
    <Navigate
      to={
        user.role === 'CONDUCTOR'
          ? '/driver'
          : ['SUPERADMIN', 'ADMIN'].includes(user.role)
            ? '/dashboard'
            : '/planner'
      }
      replace
    />
  )
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <main className="auth-loading">Verificando sesión...</main>
  if (user) {
    return (
      <Navigate
        to={
          user.role === 'CONDUCTOR'
            ? '/driver'
            : ['SUPERADMIN', 'ADMIN'].includes(user.role)
              ? '/dashboard'
              : '/planner'
        }
        replace
      />
    )
  }
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/login"
        element={<GuestRoute><AuthPage /></GuestRoute>}
      />
      <Route
        path="/register"
        element={<GuestRoute><AuthPage register /></GuestRoute>}
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute roles={['SUPERADMIN', 'ADMIN', 'PLANIFICADOR', 'VIEWER']}>
            <PlannerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <ProtectedRoute roles={['CONDUCTOR']}>
            <DriverPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
            <AdminDashboard section="dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles/new"
        element={
          <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
            <AdminDashboard section="create-vehicle" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
            <AdminDashboard section="vehicles" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/new"
        element={
          <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
            <AdminDashboard section="create-driver" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <ProtectedRoute roles={['SUPERADMIN', 'ADMIN']}>
            <AdminDashboard section="drivers" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/new"
        element={
          <ProtectedRoute roles={['SUPERADMIN']}>
            <AdminDashboard section="create-user" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/roles"
        element={
          <ProtectedRoute roles={['SUPERADMIN']}>
            <AdminDashboard section="user-roles" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['SUPERADMIN']}>
            <AdminDashboard section="user-roles" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}
