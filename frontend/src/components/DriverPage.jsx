import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { apiFetch, readApiResponse } from '../utils/api'

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este dispositivo no permite acceder al GPS del navegador.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => reject(new Error(error.message || 'No se pudo leer el GPS.')),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    )
  })
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60
  return [hours, minutes, remainder]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export default function DriverPage() {
  const { user, logout } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [vehicleId, setVehicleId] = useState('')
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const watchId = useRef(null)
  const lastSentAt = useRef(0)
  const sendingLocation = useRef(false)

  const loadVehicles = useCallback(async () => {
    try {
      const data = await readApiResponse(await apiFetch('/seguimiento/mis-vehiculos'))
      setVehicles(data)
      setVehicleId((current) => {
        if (data.some((vehicle) => String(vehicle.id) === current)) return current
        const preferred =
          data.find((vehicle) => vehicle.recorridoEstado === 'EN_CURSO') ??
          data.find((vehicle) => vehicle.pedidos.length > 0) ??
          data[0]
        return String(preferred?.id ?? '')
      })
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void loadVehicles())
    const refresh = window.setInterval(() => void loadVehicles(), 15000)
    return () => {
      window.clearInterval(refresh)
      if (watchId.current !== null) {
        navigator.geolocation?.clearWatch(watchId.current)
      }
    }
  }, [loadVehicles])

  const selectedVehicle = vehicles.find(
    (vehicle) => String(vehicle.id) === vehicleId,
  )
  const activeRoute = selectedVehicle?.recorridoEstado === 'EN_CURSO'

  const sendLocation = useCallback(async (position) => {
    if (!vehicleId || sendingLocation.current) return
    sendingLocation.current = true
    setSending(true)
    try {
      await readApiResponse(
        await apiFetch('/seguimiento/ubicacion', {
          method: 'POST',
          body: JSON.stringify({
            vehiculoId: Number(vehicleId),
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        }),
      )
      lastSentAt.current = Date.now()
      setError('')
      await loadVehicles()
    } catch (sendError) {
      setError(sendError.message)
      if (watchId.current !== null) {
        navigator.geolocation?.clearWatch(watchId.current)
        watchId.current = null
      }
      setTracking(false)
    } finally {
      sendingLocation.current = false
      setSending(false)
    }
  }, [loadVehicles, vehicleId])

  function startWatching() {
    if (!navigator.geolocation) {
      setError('Este dispositivo no permite acceder al GPS del navegador.')
      return
    }
    if (!window.isSecureContext) {
      setError('El GPS requiere HTTPS o una dirección local como localhost.')
      return
    }
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
    }
    lastSentAt.current = 0
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        if (Date.now() - lastSentAt.current < 10000) return
        void sendLocation(position)
      },
      (geoError) => {
        setError(geoError.message || 'Se perdió el acceso a la ubicación GPS.')
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    setTracking(true)
  }

  async function startRoute() {
    if (!selectedVehicle) return
    setSending(true)
    setError('')
    setNotice('')
    try {
      const position = await getCurrentPosition()
      await readApiResponse(
        await apiFetch('/seguimiento/iniciar', {
          method: 'POST',
          body: JSON.stringify({
            vehiculoId: selectedVehicle.id,
            latitud: position.coords.latitude,
            longitud: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        }),
      )
      await loadVehicles()
      setNotice('Recorrido iniciado. El GPS está activo en esta página.')
      startWatching()
    } catch (startError) {
      setError(startError.message)
    } finally {
      setSending(false)
    }
  }

  async function markDelivered(orderId) {
    setSending(true)
    setError('')
    try {
      await readApiResponse(
        await apiFetch(
          `/seguimiento/vehiculos/${selectedVehicle.id}/pedidos/${orderId}/entregar`,
          { method: 'PATCH' },
        ),
      )
      setNotice(`Pedido #${orderId} marcado como entregado.`)
      await loadVehicles()
    } catch (deliveryError) {
      setError(deliveryError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="driver-page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div><h1>RouteMind</h1><p>Seguimiento del conductor</p></div>
        </div>
        <div className="topbar-user">
          <span>{user?.name}</span>
          <button type="button" onClick={() => void logout()}>Salir</button>
        </div>
      </header>

      <section className="driver-content">
        <span className="eyebrow">PORTAL DEL CONDUCTOR</span>
        <h2>Tu recorrido</h2>
        <p className="driver-intro">
          Comparte la ubicación del teléfono mientras esta página permanezca abierta.
          La ubicación se usa para mostrar el vehículo y calcular el tiempo en cada parada.
        </p>

        {error && <div className="message error-message">{error}</div>}
        {notice && <div className="message">{notice}</div>}

        {loading ? (
          <div className="driver-panel">Cargando vehículos asignados...</div>
        ) : vehicles.length === 0 ? (
          <div className="driver-panel">
            <h3>Aún no tienes un vehículo asignado</h3>
            <p>Contacta al administrador para vincular tu cuenta a un conductor y vehículo.</p>
          </div>
        ) : (
          <>
            <label className="driver-label" htmlFor="driver-vehicle">Vehículo asignado</label>
            <select
              id="driver-vehicle"
              className="driver-select"
              value={vehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
              disabled={tracking || sending}
            >
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.codigo} · {vehicle.estado}
                </option>
              ))}
            </select>

            {selectedVehicle && (
              <section className="driver-panel">
                <div className="driver-panel-heading">
                  <div>
                    <span className="eyebrow">{selectedVehicle.codigo}</span>
                    <h3>
                      {activeRoute ? 'Recorrido en curso' : 'Ruta asignada'}
                    </h3>
                  </div>
                  <span className={tracking ? 'gps-pill gps-active' : 'gps-pill'}>
                    {tracking ? 'GPS activo' : 'GPS pausado'}
                  </span>
                </div>

                {activeRoute ? (
                  <button
                    className="refresh-button driver-action"
                    disabled={tracking || sending}
                    onClick={startWatching}
                  >
                    {sending ? 'Enviando ubicación...' : tracking ? 'Compartiendo ubicación' : 'Reanudar GPS'}
                  </button>
                ) : selectedVehicle.pedidos.length > 0 ? (
                  <button
                    className="start-route-button driver-action"
                    disabled={sending || tracking}
                    onClick={startRoute}
                  >
                    {sending ? 'Obteniendo GPS...' : '▶ Iniciar recorrido y compartir GPS'}
                  </button>
                ) : (
                  <p>No hay pedidos asignados a este vehículo.</p>
                )}

                <div className="driver-stops">
                  <h4>Entregas</h4>
                  {selectedVehicle.pedidos.map((order) => {
                    const stop = [...selectedVehicle.paradas]
                      .reverse()
                      .find((visit) => visit.pedidoId === order.id && visit.enParada)
                    return (
                      <article className="driver-stop" key={order.id}>
                        <div>
                          <strong>{order.destinatario}</strong>
                          <p>{order.direccion}</p>
                          <small>
                            Pedido #{order.id} · {stop
                              ? `En parada · ${formatDuration(stop.duracionSegundos)}`
                              : order.estado}
                          </small>
                        </div>
                        {activeRoute && order.estado === 'EN_CAMINO' && (
                          <button
                            className="secondary-button"
                            disabled={sending}
                            onClick={() => void markDelivered(order.id)}
                          >
                            Entregado
                          </button>
                        )}
                      </article>
                    )
                  })}
                </div>

                {selectedVehicle.paradas.length > 0 && (
                  <div className="driver-stop-history">
                    <h4>Tiempo registrado en paradas</h4>
                    {selectedVehicle.paradas.map((stop) => (
                      <p key={`${stop.pedidoId}-${stop.llegadaEn}`}>
                        {stop.destinatario}: {formatDuration(stop.duracionSegundos)}
                        {stop.enParada ? ' · actualmente aquí' : ''}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
        <p className="driver-gps-note">
          Mantén esta pantalla abierta y permite el acceso a ubicación. El GPS puede
          detenerse si el teléfono suspende el navegador o se pierde la conexión.
        </p>
      </section>
    </main>
  )
}
