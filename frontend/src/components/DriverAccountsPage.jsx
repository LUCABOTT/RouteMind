import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { apiFetch, readApiResponse } from '../utils/api'
import Sidebar from './Sidebar'

export default function DriverAccountsPage() {
  const { user, logout } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [credentials, setCredentials] = useState({})
  const [loading, setLoading] = useState(true)
  const [savingDriverId, setSavingDriverId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadDrivers = useCallback(async () => {
    try {
      const data = await readApiResponse(
        await apiFetch('/conductores/cuentas'),
      )
      setDrivers(data)
      setError('')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => void loadDrivers())
  }, [loadDrivers])

  function updateCredentials(driverId, field, value) {
    setCredentials((current) => ({
      ...current,
      [driverId]: {
        ...current[driverId],
        [field]: value,
      },
    }))
  }

  async function createAccount(event, driver) {
    event.preventDefault()
    const form = credentials[driver.id] || {}
    setSavingDriverId(driver.id)
    setError('')
    setNotice('')
    try {
      await readApiResponse(
        await apiFetch(`/conductores/${driver.id}/cuenta`, {
          method: 'POST',
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        }),
      )
      setCredentials((current) => ({
        ...current,
        [driver.id]: { email: '', password: '' },
      }))
      setNotice(`Cuenta de acceso creada para ${driver.nombre}.`)
      await loadDrivers()
    } catch (createError) {
      setError(createError.message)
    } finally {
      setSavingDriverId(null)
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      setError(logoutError.message)
    }
  }

  return (
    <main className="route-app admin-page driver-accounts-page">
      <Sidebar
        user={user}
        onLogout={() => void handleLogout()}
        activeSection="driver-accounts"
      />
      <section className="page-content admin-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">GESTIÓN DE ACCESOS</span>
            <h2>Cuentas de conductores</h2>
            <p>
              Crea el correo y la contraseña que cada conductor usará para
              iniciar sesión y comenzar sus recorridos.
            </p>
          </div>
          <Link className="refresh-button" to="/orders">
            Ir a pedidos
          </Link>
        </div>

        {error && <div className="message error-message">{error}</div>}
        {notice && <div className="message">{notice}</div>}

        <section className="admin-panel driver-accounts-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Conductores activos</h3>
              <p>
                Las cuentas nuevas quedan vinculadas al conductor y reciben el
                rol CONDUCTOR.
              </p>
            </div>
            <button
              className="secondary-button"
              type="button"
              disabled={loading || savingDriverId !== null}
              onClick={() => void loadDrivers()}
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <p className="driver-accounts-empty">Cargando conductores...</p>
          ) : drivers.length === 0 ? (
            <p className="driver-accounts-empty">
              No hay conductores activos. Pide a un administrador que registre
              primero el conductor.
            </p>
          ) : (
            <div className="driver-accounts-list">
              {drivers.map((driver) => {
                const form = credentials[driver.id] || {
                  email: '',
                  password: '',
                }
                const saving = savingDriverId === driver.id

                return (
                  <article className="driver-account-card" key={driver.id}>
                    <div className="driver-account-heading">
                      <div className="driver-account-avatar" aria-hidden="true">
                        {driver.nombre.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4>{driver.nombre}</h4>
                        <p>
                          {driver.cuenta
                            ? driver.cuenta.email
                            : 'Todavía no tiene cuenta de acceso'}
                        </p>
                      </div>
                      <span
                        className={`driver-account-status ${
                          driver.cuenta?.active
                            ? 'driver-account-enabled'
                            : driver.cuenta
                              ? 'driver-account-disabled'
                              : 'driver-account-missing'
                        }`}
                      >
                        {driver.cuenta
                          ? driver.cuenta.active
                            ? 'Cuenta activa'
                            : 'Cuenta desactivada'
                          : 'Sin cuenta'}
                      </span>
                    </div>

                    {!driver.cuenta && (
                      <form
                        className="driver-account-create-form"
                        onSubmit={(event) => void createAccount(event, driver)}
                      >
                        <label>
                          Correo de acceso
                          <input
                            required
                            type="email"
                            maxLength={254}
                            value={form.email}
                            onChange={(event) =>
                              updateCredentials(
                                driver.id,
                                'email',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label>
                          Contraseña temporal
                          <input
                            required
                            type="password"
                            minLength={8}
                            maxLength={72}
                            value={form.password}
                            onChange={(event) =>
                              updateCredentials(
                                driver.id,
                                'password',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <button
                          className="refresh-button"
                          disabled={saving || savingDriverId !== null}
                        >
                          {saving ? 'Creando cuenta...' : 'Crear acceso'}
                        </button>
                      </form>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}
