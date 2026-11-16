import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { apiFetch, readApiResponse } from '../utils/api'
import Sidebar from './Sidebar'

const EMPTY_ORDER = {
  destinatario: '',
  direccion: '',
  latitud: '',
  longitud: '',
  prioridad: 'MEDIA',
  observaciones: '',
}

const ROLES_WITH_ORDER_ACCESS = ['SUPERADMIN', 'ADMIN', 'PLANIFICADOR']

export default function OrdersPage() {
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState(EMPTY_ORDER)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [ordersResponse, vehiclesResponse] = await Promise.all([
        apiFetch('/pedidos'),
        apiFetch('/vehiculos'),
      ])
      const [orderData, vehicleData] = await Promise.all([
        readApiResponse(ordersResponse),
        readApiResponse(vehiclesResponse),
      ])
      setOrders(orderData)
      setVehicles(vehicleData)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void loadData())
  }, [loadData])

  async function createOrder(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await readApiResponse(
        await apiFetch('/pedidos', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            latitud: Number(form.latitud),
            longitud: Number(form.longitud),
          }),
        }),
      )
      setForm(EMPTY_ORDER)
      setNotice('Pedido creado. Ya puedes asignarlo a un vehículo disponible.')
      await loadData()
    } catch (createError) {
      setError(createError.message)
    } finally {
      setSaving(false)
    }
  }

  async function assignOrder(orderId, vehicleId) {
    if (!vehicleId) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await readApiResponse(
        await apiFetch(`/pedidos/${orderId}/asignar`, {
          method: 'PATCH',
          body: JSON.stringify({ vehiculoId: Number(vehicleId) }),
        }),
      )
      setNotice(`Pedido #${orderId} asignado al vehículo.`)
      await loadData()
    } catch (assignError) {
      setError(assignError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  const vehicleById = new Map(
    vehicles.map((vehicle) => [Number(vehicle.id), vehicle]),
  )

  return (
    <main className="route-app admin-page orders-page">
      <Sidebar
        user={user}
        onLogout={() => void handleLogout()}
        activeSection="orders"
      />
      <section className="page-content admin-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">OPERACIONES LOGÍSTICAS</span>
            <h2>Pedidos</h2>
            <p>
              Registra entregas y asígnalas a un vehículo para preparar su
              recorrido.
            </p>
          </div>
          <Link className="refresh-button orders-planner-link" to="/planner">
            Abrir planificador
          </Link>
        </div>

        {error && <div className="message error-message">{error}</div>}
        {notice && <div className="message">{notice}</div>}

        <section className="admin-panel orders-create-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Registrar pedido</h3>
              <p>La dirección y las coordenadas se usan para planificar la entrega.</p>
            </div>
          </div>
          <form className="admin-form orders-form" onSubmit={createOrder}>
            <label>
              Destinatario
              <input
                required
                maxLength={120}
                value={form.destinatario}
                onChange={(event) =>
                  setForm({ ...form, destinatario: event.target.value })
                }
              />
            </label>
            <label className="orders-address-field">
              Dirección
              <input
                required
                maxLength={255}
                value={form.direccion}
                onChange={(event) =>
                  setForm({ ...form, direccion: event.target.value })
                }
              />
            </label>
            <label>
              Latitud
              <input
                required
                type="number"
                min="-90"
                max="90"
                step="any"
                value={form.latitud}
                onChange={(event) =>
                  setForm({ ...form, latitud: event.target.value })
                }
              />
            </label>
            <label>
              Longitud
              <input
                required
                type="number"
                min="-180"
                max="180"
                step="any"
                value={form.longitud}
                onChange={(event) =>
                  setForm({ ...form, longitud: event.target.value })
                }
              />
            </label>
            <label>
              Prioridad
              <select
                value={form.prioridad}
                onChange={(event) =>
                  setForm({ ...form, prioridad: event.target.value })
                }
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </label>
            <label className="orders-address-field">
              Observaciones
              <input
                maxLength={1000}
                value={form.observaciones}
                onChange={(event) =>
                  setForm({ ...form, observaciones: event.target.value })
                }
              />
            </label>
            <div className="admin-form-actions orders-submit">
              <button className="refresh-button" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear pedido'}
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel orders-list-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Pedidos registrados</h3>
              <p>{orders.length} pedidos en el sistema</p>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void loadData()}
              disabled={loading || saving}
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <p className="orders-empty">Cargando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="orders-empty">Todavía no hay pedidos registrados.</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const assignedVehicle = vehicleById.get(
                  Number(order.vehiculoId),
                )
                const canAssign = order.estado === 'PENDIENTE'

                return (
                  <article className="orders-card" key={order.id}>
                    <div className="orders-card-main">
                      <div className="orders-card-title">
                        <span className="orders-card-id">#{order.id}</span>
                        <div>
                          <h4>{order.destinatario}</h4>
                          <p>{order.direccion}</p>
                        </div>
                      </div>
                      <div className="orders-card-meta">
                        <span className={`orders-priority priority-${order.prioridad?.toLowerCase()}`}>
                          Prioridad {order.prioridad?.toLowerCase() || 'media'}
                        </span>
                        <span className={`orders-status status-${order.estado?.toLowerCase()}`}>
                          {order.estado}
                        </span>
                        <span>
                          {assignedVehicle
                            ? `Vehículo ${assignedVehicle.codigo}`
                            : 'Sin vehículo asignado'}
                        </span>
                      </div>
                    </div>
                    {canAssign ? (
                      <label className="orders-assign">
                        Asignar vehículo
                        <select
                          defaultValue=""
                          disabled={saving}
                          onChange={(event) =>
                            void assignOrder(order.id, event.target.value)
                          }
                        >
                          <option value="" disabled>
                            {vehicles.some(
                              (vehicle) =>
                                vehicle.estado === 'DISPONIBLE' &&
                                vehicle.conductorId != null,
                            )
                              ? 'Selecciona vehículo'
                              : 'Sin vehículos disponibles con conductor'}
                          </option>
                          {vehicles
                            .filter(
                              (vehicle) =>
                                vehicle.estado === 'DISPONIBLE' &&
                                vehicle.conductorId != null,
                            )
                            .map((vehicle) => (
                              <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.codigo} · {vehicle.conductor || 'Sin conductor'}
                              </option>
                            ))}
                        </select>
                      </label>
                    ) : (
                      <span className="orders-assigned-label">
                        {order.estado === 'ASIGNADO'
                          ? 'Listo para iniciar'
                          : 'Asignación cerrada'}
                      </span>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <aside className="orders-driver-note">
          <strong>Siguiente paso</strong>
          <span>
            Tras asignar pedidos, el conductor inicia sesión en su portal y
            pulsa «Iniciar recorrido» para activar el GPS.
          </span>
          {ROLES_WITH_ORDER_ACCESS.includes(user?.role) && (
            <Link to="/planner">Ir al planificador de rutas</Link>
          )}
        </aside>
      </section>
    </main>
  )
}
