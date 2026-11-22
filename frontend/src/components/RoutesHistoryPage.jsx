import { useCallback, useEffect, useRef, useState } from 'react'
import HistorySection from './HistorySection'
import RouteDetail from './RouteDetail'
import Sidebar from './Sidebar'
import { useAuth } from '../auth/useAuth'
import { apiFetch } from '../utils/api'

function getList(payload, resource) {
  const list = Array.isArray(payload) ? payload : payload?.data
  if (!Array.isArray(list)) {
    throw new Error(`La API de ${resource} devolvió un formato inesperado.`)
  }
  return list
}

export default function RoutesHistoryPage() {
  const { user, logout } = useAuth()
  const [historialRecorridos, setHistorialRecorridos] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [errorHistorial, setErrorHistorial] = useState('')
  const [recorridoSeleccionado, setRecorridoSeleccionado] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')
  const [rutaHistorica, setRutaHistorica] = useState([])
  const [cargandoRutaHistorica, setCargandoRutaHistorica] = useState(false)
  const [errorRutaHistorica, setErrorRutaHistorica] = useState('')
  const detalleRecorridoRef = useRef(null)

  const cargarDatos = useCallback(async () => {
    setCargandoHistorial(true)
    setErrorHistorial('')

    try {
      const [recorridosResponse, vehiculosResponse] = await Promise.all([
        apiFetch('/recorridos'),
        apiFetch('/vehiculos'),
      ])
      const [recorridosData, vehiculosData] = await Promise.all([
        recorridosResponse.json(),
        vehiculosResponse.json(),
      ])

      if (!recorridosResponse.ok) {
        throw new Error(
          recorridosData.message || 'No se pudo cargar el historial de recorridos.',
        )
      }
      if (!vehiculosResponse.ok) {
        throw new Error(
          vehiculosData.message || 'No se pudieron cargar los vehículos.',
        )
      }

      setHistorialRecorridos(getList(recorridosData, 'recorridos'))
      setVehiculos(getList(vehiculosData, 'vehículos'))
    } catch (error) {
      setErrorHistorial(error.message || 'No se pudo cargar el historial.')
    } finally {
      setCargandoHistorial(false)
    }
  }, [])

  useEffect(() => {
    let refreshTimer
    const refresh = () => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => void cargarDatos(), 150)
    }

    queueMicrotask(() => void cargarDatos())
    window.addEventListener('routemind:route-updated', refresh)
    window.addEventListener('routemind:reconnected', refresh)

    return () => {
      window.clearTimeout(refreshTimer)
      window.removeEventListener('routemind:route-updated', refresh)
      window.removeEventListener('routemind:reconnected', refresh)
    }
  }, [cargarDatos])

  useEffect(() => {
    if (recorridoSeleccionado) {
      detalleRecorridoRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [recorridoSeleccionado])

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

      const coordenadasGps = (data.ubicacionesGps || [])
        .filter(
          (ubicacion) =>
            ubicacion.latitud != null &&
            ubicacion.longitud != null &&
            Number.isFinite(Number(ubicacion.latitud)) &&
            Number.isFinite(Number(ubicacion.longitud)),
        )
        .map((ubicacion) => [
          Number(ubicacion.latitud),
          Number(ubicacion.longitud),
        ])

      if (coordenadasGps.length > 0) {
        setRutaHistorica(coordenadasGps)
        return
      }

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
          .map(([longitud, latitud]) => `${longitud},${latitud}`)
          .join(';')
        const urlOSRM =
          `https://router.project-osrm.org/route/v1/driving/${coordenadasOSRM}` +
          '?overview=full&geometries=geojson&steps=false'
        const routeResponse = await fetch(urlOSRM)
        const routeData = await routeResponse.json()

        if (
          !routeResponse.ok ||
          routeData.code !== 'Ok' ||
          !routeData.routes?.length
        ) {
          throw new Error('OSRM no encontró una ruta para estas ubicaciones.')
        }

        setRutaHistorica(
          routeData.routes[0].geometry.coordinates.map(
            ([longitud, latitud]) => [latitud, longitud],
          ),
        )
      } catch (error) {
        setErrorRutaHistorica(
          error.message || 'No se pudo calcular la ruta histórica.',
        )
      } finally {
        setCargandoRutaHistorica(false)
      }
    } catch (error) {
      setErrorDetalle(
        error.message || 'Ocurrió un error al consultar el recorrido.',
      )
    } finally {
      setCargandoDetalle(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      setErrorHistorial(error.message || 'No se pudo cerrar la sesión.')
    }
  }

  return (
    <main className="route-app">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        activeSection="history"
      />
      <section className="page-content">
        <HistorySection
          historialRecorridos={historialRecorridos}
          vehiculos={vehiculos}
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
          RouteMind · Historial de recorridos
        </footer>
      </section>
    </main>
  )
}
