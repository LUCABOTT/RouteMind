
import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  Gauge,
  MapPinned,
  Route,
  Truck,
  UserRound,
  X,
} from 'lucide-react'

import { formatDate } from '../utils/formDate'
import { obtenerDistanciaEstimadaKm } from '../utils/route'


const obtenerFechaLocal = (fecha = new Date()) => {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatearKm = (valor) =>
  valor.toLocaleString('es-HN', {
    maximumFractionDigits: 1,
  })

function HistorySection({
  historialRecorridos = [],
  vehiculos = [],
  vehiculoId,
  cargandoHistorial,
  errorHistorial,
  onVerDetalle,
  cargandoDetalle,
  cargandoRutaHistorica,
}) {
  const [estadisticasVehiculoId, setEstadisticasVehiculoId] =
    useState('')
  const [estadisticasConductor, setEstadisticasConductor] =
    useState('')

  const [fechaDesde, setFechaDesde] = useState(() => {
    const hoy = obtenerFechaLocal()
    return `${hoy.slice(0, 8)}01`
  })

  const [fechaHasta, setFechaHasta] = useState(() =>
    obtenerFechaLocal(),
  )

  const recorridosVehiculo = historialRecorridos.filter(
    (recorrido) =>
      Number(recorrido.vehiculoId) === Number(vehiculoId),
  )

  const conductores = [
    ...new Set(
      vehiculos.map((vehiculo) => vehiculo.conductor).filter(Boolean),
    ),
  ]

  const periodoValido =
    !fechaDesde || !fechaHasta || fechaDesde <= fechaHasta

  const resumenEstadisticas = useMemo(() => {
    const recorridos = periodoValido
      ? historialRecorridos.filter((recorrido) => {
          const fechaRecorrido = String(
            recorrido.fechaInicio || '',
          ).slice(0, 10)

          const coincideVehiculo =
            !estadisticasVehiculoId ||
            Number(recorrido.vehiculoId) ===
              Number(estadisticasVehiculoId)

          const coincideConductor =
            !estadisticasConductor ||
            recorrido.vehiculo?.conductor === estadisticasConductor

          const coincideFecha =
            (!fechaDesde || fechaRecorrido >= fechaDesde) &&
            (!fechaHasta || fechaRecorrido <= fechaHasta)

          return (
            coincideVehiculo &&
            coincideConductor &&
            coincideFecha
          )
        })
      : []

    return recorridos.reduce(
      (resumen, recorrido) => {
        resumen.totalRecorridos += 1

        const distancia = obtenerDistanciaEstimadaKm(recorrido)

        if (distancia == null) return resumen

        resumen.distanciaKm += distancia

        const claveVehiculo = String(recorrido.vehiculoId)

        const itemVehiculo =
          resumen.vehiculos.get(claveVehiculo) || {
            nombre:
              recorrido.vehiculo?.codigo ||
              `Vehículo #${recorrido.vehiculoId}`,
            distanciaKm: 0,
            recorridos: 0,
          }

        itemVehiculo.distanciaKm += distancia
        itemVehiculo.recorridos += 1
        resumen.vehiculos.set(claveVehiculo, itemVehiculo)

        const nombreConductor =
          recorrido.vehiculo?.conductor || 'Sin conductor asignado'

        const itemConductor =
          resumen.conductores.get(nombreConductor) || {
            distanciaKm: 0,
            recorridos: 0,
          }

        itemConductor.distanciaKm += distancia
        itemConductor.recorridos += 1
        resumen.conductores.set(nombreConductor, itemConductor)

        return resumen
      },
      {
        distanciaKm: 0,
        totalRecorridos: 0,
        vehiculos: new Map(),
        conductores: new Map(),
      },
    )
  }, [
    estadisticasConductor,
    estadisticasVehiculoId,
    fechaDesde,
    fechaHasta,
    historialRecorridos,
    periodoValido,
  ])

  const vehiculosOrdenados = [
    ...resumenEstadisticas.vehiculos.values(),
  ].sort((a, b) => b.distanciaKm - a.distanciaKm)

  const conductoresOrdenados = [
    ...resumenEstadisticas.conductores.entries(),
  ].sort((a, b) => b[1].distanciaKm - a[1].distanciaKm)

  const distanciaMaxima = Math.max(
    1,
    ...vehiculosOrdenados.map((item) => item.distanciaKm),
  )

  const filtrosActivos = [
    estadisticasVehiculoId,
    estadisticasConductor,
    fechaDesde,
    fechaHasta,
  ].filter(Boolean).length

  const limpiarFiltros = () => {
    setEstadisticasVehiculoId('')
    setEstadisticasConductor('')
    setFechaDesde('')
    setFechaHasta('')
  }

  return (
    <section className="hs-section" id="history">
      {/* Encabezado */}
      <header className="hs-header">
        <div className="hs-header-copy">
          <span className="hs-eyebrow">
            <Activity size={14} />
            CENTRO DE CONTROL LOGÍSTICO
          </span>

          <h2>Historial de recorridos</h2>

          <p>
            Consulta las operaciones, analiza distancias y compara el
            rendimiento de tu flota.
          </p>
        </div>

        <div className="hs-header-badge">
          <div className="hs-header-badge-icon">
            <Route size={21} />
          </div>
          <div>
            <strong>{recorridosVehiculo.length}</strong>
            <span>
              {recorridosVehiculo.length === 1
                ? 'Recorrido registrado'
                : 'Recorridos registrados'}
            </span>
          </div>
        </div>
      </header>

      {/* Panel de estadísticas */}
      <section className="hs-analytics">
        <div className="hs-analytics-header">
          <div>
            <span className="hs-section-kicker">
              ANÁLISIS DE RENDIMIENTO
            </span>
            <h3>Resumen de actividad</h3>
            <p>Filtra los datos para consultar un período específico.</p>
          </div>

          <span className="hs-analytics-icon">
            <Gauge size={22} />
          </span>
        </div>

        {/* Filtros */}
        <div className="hs-filters">
          <div className="hs-filters-title">
            <Filter size={16} />
            <strong>Filtros de análisis</strong>
            {filtrosActivos > 0 && (
              <span>{filtrosActivos} aplicados</span>
            )}
          </div>

          <div className="hs-filter-grid">
            <label className="hs-field">
              <span>Vehículo</span>
              <div className="hs-input-wrap">
                <Truck size={16} />
                <select
                  value={estadisticasVehiculoId}
                  onChange={(event) =>
                    setEstadisticasVehiculoId(event.target.value)
                  }
                >
                  <option value="">Todos los vehículos</option>
                  {vehiculos.map((vehiculo) => (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.codigo} — {vehiculo.conductor}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="hs-field">
              <span>Conductor</span>
              <div className="hs-input-wrap">
                <UserRound size={16} />
                <select
                  value={estadisticasConductor}
                  onChange={(event) =>
                    setEstadisticasConductor(event.target.value)
                  }
                >
                  <option value="">Todos los conductores</option>
                  {conductores.map((conductor) => (
                    <option key={conductor} value={conductor}>
                      {conductor}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <label className="hs-field">
              <span>Fecha inicial</span>
              <div className="hs-input-wrap">
                <CalendarDays size={16} />
                <input
                  type="date"
                  value={fechaDesde}
                  max={fechaHasta || undefined}
                  onChange={(event) => setFechaDesde(event.target.value)}
                />
              </div>
            </label>

            <label className="hs-field">
              <span>Fecha final</span>
              <div className="hs-input-wrap">
                <CalendarDays size={16} />
                <input
                  type="date"
                  value={fechaHasta}
                  min={fechaDesde || undefined}
                  onChange={(event) => setFechaHasta(event.target.value)}
                />
              </div>
            </label>
          </div>

          {filtrosActivos > 0 && (
            <button
              type="button"
              className="hs-clear-filters"
              onClick={limpiarFiltros}
            >
              <X size={14} />
              Limpiar filtros
            </button>
          )}
        </div>

        {!periodoValido && (
          <div className="hs-error">
            La fecha inicial no puede ser posterior a la fecha final.
          </div>
        )}

        {/* Indicadores */}
        <div className="hs-kpi-grid">
          <article className="hs-kpi hs-kpi-distance">
            <div className="hs-kpi-top">
              <span>Distancia estimada acumulada</span>
              <span className="hs-kpi-icon">
                <MapPinned size={19} />
              </span>
            </div>
            <strong>
              {formatearKm(resumenEstadisticas.distanciaKm)}
              <small> km</small>
            </strong>
            <p>Distancia estimada de recorridos con datos disponibles</p>
          </article>

          <article className="hs-kpi hs-kpi-routes">
            <div className="hs-kpi-top">
              <span>Total de recorridos</span>
              <span className="hs-kpi-icon">
                <Route size={19} />
              </span>
            </div>
            <strong>{resumenEstadisticas.totalRecorridos}</strong>
            <p>Operaciones dentro del período seleccionado</p>
          </article>

          <article className="hs-kpi hs-kpi-fleet">
            <div className="hs-kpi-top">
              <span>Vehículos con actividad</span>
              <span className="hs-kpi-icon">
                <Truck size={19} />
              </span>
            </div>
            <strong>{resumenEstadisticas.vehiculos.size}</strong>
            <p>Vehículos con distancia estimada registrada</p>
          </article>

          <article className="hs-kpi hs-kpi-drivers">
            <div className="hs-kpi-top">
              <span>Conductores con actividad</span>
              <span className="hs-kpi-icon">
                <UserRound size={19} />
              </span>
            </div>
            <strong>{resumenEstadisticas.conductores.size}</strong>
            <p>Conductores con recorridos contabilizados</p>
          </article>
        </div>

        {/* Comparativas */}
        <div className="hs-rankings">
          <article className="hs-ranking-card">
            <div className="hs-ranking-heading">
              <div className="hs-ranking-icon hs-ranking-truck">
                <Truck size={18} />
              </div>
              <div>
                <h4>Rendimiento por vehículo</h4>
                <p>Distancia estimada acumulada</p>
              </div>
            </div>

            {vehiculosOrdenados.length > 0 ? (
              <div className="hs-ranking-list">
                {vehiculosOrdenados.map((item, index) => (
                  <div className="hs-ranking-item" key={item.nombre}>
                    <div className="hs-ranking-item-top">
                      <div className="hs-ranking-name">
                        <span className="hs-ranking-position">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <strong>{item.nombre}</strong>
                          <small>
                            {item.recorridos}{' '}
                            {item.recorridos === 1
                              ? 'recorrido'
                              : 'recorridos'}
                          </small>
                        </div>
                      </div>

                      <strong className="hs-ranking-value">
                        {formatearKm(item.distanciaKm)} km
                      </strong>
                    </div>

                    <div className="hs-ranking-track">
                      <div
                        className="hs-ranking-fill hs-fill-vehicle"
                        style={{
                          width: `${(item.distanciaKm / distanciaMaxima) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hs-empty-small">
                Sin datos de vehículos para este período.
              </div>
            )}
          </article>

          <article className="hs-ranking-card">
            <div className="hs-ranking-heading">
              <div className="hs-ranking-icon hs-ranking-driver">
                <UserRound size={18} />
              </div>
              <div>
                <h4>Rendimiento por conductor</h4>
                <p>Actividad acumulada por conductor</p>
              </div>
            </div>

            {conductoresOrdenados.length > 0 ? (
              <div className="hs-driver-list">
                {conductoresOrdenados.map(([nombre, item], index) => (
                  <div className="hs-driver-item" key={nombre}>
                    <div className="hs-driver-avatar">
                      {nombre === 'Sin conductor asignado'
                        ? <UserRound size={17} />
                        : nombre.trim().charAt(0).toUpperCase()}
                    </div>

                    <div className="hs-driver-info">
                      <strong>{nombre}</strong>
                      <span>
                        {item.recorridos}{' '}
                        {item.recorridos === 1
                          ? 'recorrido'
                          : 'recorridos'}
                      </span>
                    </div>

                    <div className="hs-driver-distance">
                      <strong>{formatearKm(item.distanciaKm)} km</strong>
                      {index === 0 && (
                        <span className="hs-driver-top-label">
                          Mayor distancia
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="hs-empty-small">
                Sin datos de conductores para este período.
              </div>
            )}
          </article>
        </div>
      </section>

      {/* Historial de recorridos */}
      <section className="hs-history">
        <div className="hs-history-heading">
          <div>
            <span className="hs-section-kicker">REGISTRO DE OPERACIONES</span>
            <h3>Recorridos del vehículo</h3>
            <p>
              Consulta las fechas, las distancias y los detalles de cada
              recorrido.
            </p>
          </div>

          <span className="hs-history-count">
            {recorridosVehiculo.length}{' '}
            {recorridosVehiculo.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {errorHistorial && (
          <div className="hs-error">{errorHistorial}</div>
        )}

        {cargandoHistorial ? (
          <div className="hs-loading">
            <span className="hs-loading-spinner" />
            <strong>Cargando historial...</strong>
            <p>Estamos preparando los recorridos del vehículo.</p>
          </div>
        ) : recorridosVehiculo.length > 0 ? (
          <div className="hs-route-list">
            {recorridosVehiculo.map((recorrido) => {
              const distanciaEstimada =
                obtenerDistanciaEstimadaKm(recorrido)

              const completado = recorrido.estado === 'COMPLETADO'
              const totalPedidos = recorrido.totalPedidos ?? 0

              return (
                <article className="hs-route-card" key={recorrido.id}>
                  <div className="hs-route-card-top">
                    <div className="hs-route-identity">
                      <div className="hs-route-icon">
                        <Route size={21} />
                      </div>

                      <div>
                        <span className="hs-route-overline">
                          REGISTRO DE RECORRIDO
                        </span>
                        <h4>Recorrido #{recorrido.id}</h4>
                        <p>
                          {recorrido.vehiculo?.codigo ||
                            `Vehículo #${recorrido.vehiculoId}`}
                          {' · '}
                          {recorrido.vehiculo?.conductor ||
                            'Sin conductor'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`hs-route-status ${
                        completado ? 'hs-status-done' : 'hs-status-active'
                      }`}
                    >
                      <span />
                      {completado ? 'Completado' : 'En curso'}
                    </span>
                  </div>

                  <div className="hs-route-stats">
                    <div className="hs-route-stat">
                      <span className="hs-route-stat-icon">
                        <MapPinned size={17} />
                      </span>
                      <div>
                        <span>Distancia estimada</span>
                        <strong>
                          {distanciaEstimada != null
                            ? `${distanciaEstimada.toFixed(1)} km`
                            : 'No disponible'}
                        </strong>
                      </div>
                    </div>

                    <div className="hs-route-stat">
                      <span className="hs-route-stat-icon hs-icon-orders">
                        <CheckCircle2 size={17} />
                      </span>
                      <div>
                        <span>Pedidos asociados</span>
                        <strong>
                          {totalPedidos}{' '}
                          {totalPedidos === 1 ? 'pedido' : 'pedidos'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="hs-route-timeline">
                    <div className="hs-timeline-item">
                      <span className="hs-timeline-dot hs-dot-start" />
                      <div>
                        <span>INICIO DEL RECORRIDO</span>
                        <strong>{formatDate(recorrido.fechaInicio)}</strong>
                      </div>
                    </div>

                    <div className="hs-timeline-connector" />

                    <div className="hs-timeline-item">
                      <span
                        className={`hs-timeline-dot ${
                          recorrido.fechaFin
                            ? 'hs-dot-finish'
                            : 'hs-dot-pending'
                        }`}
                      />
                      <div>
                        <span>FIN DEL RECORRIDO</span>
                        <strong>
                          {recorrido.fechaFin
                            ? formatDate(recorrido.fechaFin)
                            : 'Pendiente de finalización'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="hs-route-card-footer">
                    <span className="hs-route-record-id">
                      <Clock3 size={14} />
                      ID de operación: #{recorrido.id}
                    </span>

                    <button
                      type="button"
                      className="hs-detail-button"
                      onClick={() => onVerDetalle(recorrido.id)}
                      disabled={
                        cargandoDetalle || cargandoRutaHistorica
                      }
                    >
                      {cargandoDetalle || cargandoRutaHistorica
                        ? 'Cargando detalle...'
                        : 'Ver mapa del recorrido'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          !errorHistorial && (
            <div className="hs-empty">
              <div className="hs-empty-icon">
                <Route size={27} />
              </div>
              <h4>No hay recorridos registrados</h4>
              <p>
                Cuando este vehículo tenga recorridos registrados,
                aparecerán aquí para que puedas consultar su historial.
              </p>
            </div>
          )
        )}
      </section>

      <footer className="hs-footer">
        <div className="hs-footer-brand">
          <span className="hs-footer-logo">
            <Route size={16} />
          </span>
          <strong>RouteMind</strong>
        </div>

        <span>Control y análisis de recorridos</span>

        <span className="hs-footer-indicator">
          <ArrowDownRight size={14} />
          Historial logístico
        </span>
      </footer>
    </section>
  )
}

export default HistorySection
