import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { apiFetch, readApiResponse } from '../utils/api'

const USER_ROLES = ['ADMIN', 'PLANIFICADOR', 'VIEWER']
const VEHICLE_STATES = ['DISPONIBLE', 'MANTENIMIENTO']
const emptyVehicle = { codigo: '', capacidad: '10', conductorId: '' }
const emptyDriver = { nombre: '', telefono: '', licencia: '' }
const emptyUser = { name: '', email: '', password: '', role: 'PLANIFICADOR' }
const PAGE_SIZE = 10

function pageRecords(records, page) {
  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  return records.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
}

function AdminPagination({ page, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const start = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, total)

  return (
    <div className="admin-pagination">
      <span>Mostrando {start}–{end} de {total}</span>
      <div>
        <button type="button" aria-label="Página anterior" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)}>‹</button>
        <span>{currentPage} / {pages}</span>
        <button type="button" aria-label="Página siguiente" disabled={currentPage >= pages} onClick={() => onChange(currentPage + 1)}>›</button>
      </div>
    </div>
  )
}

export default function AdminDashboard({ section = 'dashboard' }) {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState(() => (
    section === 'vehicles' || section === 'create-vehicle' ? 'vehiculos'
      : section === 'drivers' || section === 'create-driver' ? 'conductores'
        : ['users', 'create-user', 'user-roles'].includes(section) ? 'usuarios' : 'dashboard'
  ))
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [users, setUsers] = useState([])
  const [userForm, setUserForm] = useState(emptyUser)
  const [vehicleForm, setVehicleForm] = useState(emptyVehicle)
  const [driverForm, setDriverForm] = useState(emptyDriver)
  const [accountDriverId, setAccountDriverId] = useState(null)
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [editingDriver, setEditingDriver] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState(null)
  const [userRole, setUserRole] = useState('PLANIFICADOR')
  const [vehicleStatus, setVehicleStatus] = useState('DISPONIBLE')
  const [vehiclePage, setVehiclePage] = useState(1)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [driverPage, setDriverPage] = useState(1)
  const [driverSearch, setDriverSearch] = useState('')
  const [driverFilter, setDriverFilter] = useState('all')
  const [userPage, setUserPage] = useState(1)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const isSuperadmin = user?.role === 'SUPERADMIN'
  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = vehicleSearch.trim().toLowerCase()
    const matchesQuery = !query || [vehicle.codigo, vehicle.conductor].some((value) => String(value || '').toLowerCase().includes(query))
    return matchesQuery && (vehicleFilter === 'all' || vehicle.estado === vehicleFilter)
  })
  const filteredDrivers = drivers.filter((driver) => {
    const query = driverSearch.trim().toLowerCase()
    const matchesQuery = !query || [driver.nombre, driver.telefono, driver.licencia, driver.cuenta?.email].some((value) => String(value || '').toLowerCase().includes(query))
    const matchesStatus = driverFilter === 'all' || (driverFilter === 'active' ? driver.activo : !driver.activo)
    return matchesQuery && matchesStatus
  })
  const filteredUsers = users.filter((account) => {
    const query = userSearch.trim().toLowerCase()
    const matchesQuery = !query || [account.name, account.email].some((value) => String(value || '').toLowerCase().includes(query))
    const matchesRole = userRoleFilter === 'all' || account.role === userRoleFilter
    const matchesStatus = userStatusFilter === 'all' || (userStatusFilter === 'active' ? account.active : !account.active)
    return matchesQuery && matchesRole && matchesStatus
  })
  const visibleVehicles = pageRecords(filteredVehicles, vehiclePage)
  const visibleDrivers = pageRecords(filteredDrivers, driverPage)
  const visibleUsers = pageRecords(filteredUsers, userPage)

  useEffect(() => {
    setTab(
      section === 'vehicles' || section === 'create-vehicle' ? 'vehiculos'
        : section === 'drivers' || section === 'create-driver' ? 'conductores'
          : ['users', 'create-user', 'user-roles'].includes(section) ? 'usuarios' : 'dashboard',
    )
  }, [section])

  const loadData = useCallback(async () => {
    setError('')
    try {
      const requests = [
        apiFetch('/vehiculos'),
        apiFetch('/conductores'),
        ...(isSuperadmin ? [apiFetch('/users')] : []),
      ]
      const responses = await Promise.all(requests)
      const data = await Promise.all(responses.map(readApiResponse))
      setVehicles(data[0])
      setDrivers(data[1])
      if (isSuperadmin) setUsers(data[2])
    } catch (loadError) {
      setError(loadError.message)
    }
  }, [isSuperadmin])

  useEffect(() => {
    queueMicrotask(() => {
      void loadData()
    })
  }, [loadData])

  async function runAction(action, successMessage) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(successMessage)
      await loadData()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  function submitVehicle(event) {
    event.preventDefault()
    const method = editingVehicle ? 'PATCH' : 'POST'
    const endpoint = editingVehicle
      ? `/vehiculos/${editingVehicle}`
      : '/vehiculos'
    const body = {
      ...vehicleForm,
      capacidad: Number(vehicleForm.capacidad),
      conductorId: vehicleForm.conductorId
        ? Number(vehicleForm.conductorId)
        : null,
    }
    runAction(
      async () => {
        await readApiResponse(
          await apiFetch(endpoint, { method, body: JSON.stringify(body) }),
        )
        if (editingVehicle && vehicleStatus !== modal?.record?.estado) {
          await readApiResponse(
            await apiFetch(`/vehiculos/${editingVehicle}/estado`, {
              method: 'PATCH',
              body: JSON.stringify({ estado: vehicleStatus }),
            }),
          )
        }
        setVehicleForm(emptyVehicle)
        setEditingVehicle(null)
        setModal(null)
      },
      editingVehicle ? 'Vehículo actualizado.' : 'Vehículo creado.',
    )
  }

  function submitDriver(event) {
    event.preventDefault()
    const method = editingDriver ? 'PATCH' : 'POST'
    const endpoint = editingDriver
      ? `/conductores/${editingDriver}`
      : '/conductores'
    runAction(
      async () => {
        await readApiResponse(
          await apiFetch(endpoint, {
            method,
            body: JSON.stringify({
              ...driverForm,
              telefono: driverForm.telefono || null,
              licencia: driverForm.licencia || null,
            }),
          }),
        )
        setDriverForm(emptyDriver)
        setEditingDriver(null)
        setModal(null)
      },
      editingDriver ? 'Conductor actualizado.' : 'Conductor creado.',
    )
  }

  function submitDriverAccount(event) {
    event.preventDefault()
    if (!accountDriverId) return
    runAction(
      async () => {
        await readApiResponse(
          await apiFetch(`/conductores/${accountDriverId}/cuenta`, {
            method: 'POST',
            body: JSON.stringify({
              email: accountEmail,
              password: accountPassword,
            }),
          }),
        )
        setAccountDriverId(null)
        setAccountEmail('')
        setAccountPassword('')
      },
      'Cuenta del conductor creada y vinculada.',
    )
  }

  function submitUser(event) {
    event.preventDefault()
    runAction(
      async () => {
        await readApiResponse(
          await apiFetch('/users', {
            method: 'POST',
            body: JSON.stringify(userForm),
          }),
        )
        setUserForm(emptyUser)
      },
      'Usuario creado.',
    )
  }

  function removeRecord(endpoint, message) {
    if (endpoint.startsWith('/vehiculos') && modal?.record?.estado === 'EN_RUTA') return
    const entity = endpoint.startsWith('/vehiculos')
      ? 'vehículo'
      : endpoint.startsWith('/conductores')
        ? 'conductor'
        : 'usuario'
    setModal({
      type: 'delete',
      title: `Eliminar ${entity}`,
      message: `¿Seguro que quieres eliminar este ${entity}? Esta acción no se puede deshacer.`,
      endpoint,
      successMessage: message,
    })
  }

  function closeModal() {
    setModal(null)
    setEditingVehicle(null)
    setEditingDriver(null)
    setVehicleForm(emptyVehicle)
    setVehicleStatus('DISPONIBLE')
    setDriverForm(emptyDriver)
  }

  useEffect(() => {
    if (!modal) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setModal(null)
        setEditingVehicle(null)
        setEditingDriver(null)
        setVehicleForm(emptyVehicle)
        setDriverForm(emptyDriver)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modal])

  function updateUser(id, endpoint, body, message) {
    runAction(
      async () => {
        await readApiResponse(
          await apiFetch(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body),
          }),
        )
      },
      message,
    )
  }

  function saveUserRole(event) {
    event.preventDefault()
    if (!modal?.record) return
    runAction(
      async () => {
        await readApiResponse(
          await apiFetch(`/users/${modal.record.id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: userRole }),
          }),
        )
        closeModal()
      },
      'Rol actualizado.',
    )
  }

  function confirmRemove() {
    if (!modal?.endpoint) return
    runAction(
      async () => {
        await readApiResponse(await apiFetch(modal.endpoint, { method: 'DELETE' }))
        closeModal()
      },
      modal.successMessage,
    )
  }

  return (
    <main className="admin-page route-app" data-section={section}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h1>RouteMind</h1>
            <p>Administración del sistema</p>
          </div>
        </div>
        <nav className="topbar-nav admin-sidebar-nav" aria-label="Navegación principal">
          <Link className={section === 'dashboard' ? 'active' : ''} to="/dashboard">Dashboard</Link>
          <Link to="/planner">Route Optimizer</Link>
          <Link className={section === 'create-driver' ? 'active' : ''} to="/drivers/new">Crear conductor</Link>
          <Link className={section === 'create-vehicle' ? 'active' : ''} to="/vehicles/new">Crear vehículo</Link>
          {isSuperadmin && <Link className={section === 'create-user' ? 'active' : ''} to="/users/new">Crear usuario</Link>}
          {isSuperadmin && <Link className={section === 'user-roles' ? 'active' : ''} to="/users/roles">Cuentas y roles</Link>}
          <Link className={section === 'vehicles' ? 'active' : ''} to="/vehicles">Vehículos</Link>
          <Link className={section === 'drivers' ? 'active' : ''} to="/drivers">Conductores</Link>
          {isSuperadmin && <Link className={section === 'users' ? 'active' : ''} to="/users">Usuarios y roles</Link>}
        </nav>
        <div className="topbar-user topbar-user-sidebar">
          <span className="user-avatar" aria-hidden="true">{user?.name?.slice(0, 2)?.toUpperCase() || 'RM'}</span>
          <span className="sidebar-user-copy">{user?.name}<small>{user?.role}</small></span>
          <Link to="/planner">Planificador</Link>
          <span>{user?.name} · {user?.role}</span>
          <button
            type="button"
            onClick={async () => {
              try {
                await logout()
              } catch (logoutError) {
                setError(logoutError.message)
              }
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <section className="admin-content page-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">PANEL DE CONTROL</span>
            <h2 className="admin-page-title">{section === 'vehicles' ? 'Vehículos' : section === 'drivers' ? 'Conductores' : section === 'users' ? 'Usuarios y roles' : 'Dashboard'}</h2>
            <h2>Administración</h2>
            <p>Gestiona vehículos, conductores y accesos según tu rol.</p>
          </div>
          {section === 'vehicles' && <Link className="refresh-button admin-new-link" to="/vehicles/new">+ Nuevo vehículo</Link>}
          {section === 'drivers' && <Link className="refresh-button admin-new-link" to="/drivers/new">+ Nuevo conductor</Link>}
          {section === 'user-roles' && <Link className="refresh-button admin-new-link" to="/users/new">+ Nuevo usuario</Link>}
          <button className="refresh-button" onClick={loadData} disabled={busy}>
            Actualizar
          </button>
        </div>

        <nav className="admin-tabs" aria-label="Secciones de administración">
          <button
            className={tab === 'vehiculos' ? 'active' : ''}
            onClick={() => setTab('vehiculos')}
          >
            Vehículos
          </button>
          <button
            className={tab === 'conductores' ? 'active' : ''}
            onClick={() => setTab('conductores')}
          >
            Conductores
          </button>
          {isSuperadmin && (
            <button
              className={tab === 'usuarios' ? 'active' : ''}
              onClick={() => setTab('usuarios')}
            >
              Usuarios y roles
            </button>
          )}
        </nav>

        {error && <div className="message error-message">{error}</div>}
        {notice && <div className="message">{notice}</div>}

        {tab === 'dashboard' && (
          <>
            <section className="metrics admin-metrics">
              <article className="metric-card"><span className="metric-label">Vehículos registrados</span><strong>{vehicles.length}</strong><small>Flota de la operación</small></article>
              <article className="metric-card"><span className="metric-label">Conductores activos</span><strong>{drivers.filter((driver) => driver.activo).length}</strong><small>Disponibles para asignación</small></article>
              <article className="metric-card"><span className="metric-label">En ruta</span><strong>{vehicles.filter((vehicle) => vehicle.estado === 'EN_RUTA').length}</strong><small>Vehículos realizando entregas</small></article>
              {isSuperadmin && <article className="metric-card"><span className="metric-label">Usuarios del sistema</span><strong>{users.length}</strong><small>Cuentas registradas</small></article>}
            </section>
            <section className="admin-panel admin-shortcuts">
              <div className="admin-panel-heading"><h3>Accesos rápidos</h3><p>Abre una sección para administrar sus registros.</p></div>
              <div className="admin-shortcut-grid">
                <Link to="/vehicles"><strong>Vehículos</strong><span>{vehicles.length} registrados</span></Link>
                <Link to="/drivers"><strong>Conductores</strong><span>{drivers.length} registrados</span></Link>
                {isSuperadmin && <Link to="/users"><strong>Usuarios y roles</strong><span>{users.length} cuentas</span></Link>}
                <Link to="/planner"><strong>Route Optimizer</strong><span>Planificación de entregas</span></Link>
              </div>
            </section>
          </>
        )}

        {tab === 'vehiculos' && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h3>{editingVehicle ? 'Editar vehículo' : 'Nuevo vehículo'}</h3>
            </div>
            <form className="admin-form" onSubmit={submitVehicle}>
              <label>
                Código
                <input
                  required
                  maxLength={20}
                  value={vehicleForm.codigo}
                  onChange={(event) =>
                    setVehicleForm({ ...vehicleForm, codigo: event.target.value })
                  }
                />
              </label>
              <label>
                Capacidad
                <input
                  required
                  type="number"
                  min="1"
                  value={vehicleForm.capacidad}
                  onChange={(event) =>
                    setVehicleForm({ ...vehicleForm, capacidad: event.target.value })
                  }
                />
              </label>
              <label>
                Conductor
                <select
                  value={vehicleForm.conductorId}
                  onChange={(event) =>
                    setVehicleForm({
                      ...vehicleForm,
                      conductorId: event.target.value,
                    })
                  }
                >
                  <option value="">Sin asignar</option>
                  {drivers.filter((driver) => driver.activo).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-form-actions">
                <button className="refresh-button" disabled={busy}>
                  {editingVehicle ? 'Guardar cambios' : 'Crear vehículo'}
                </button>
                {editingVehicle && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingVehicle(null)
                      setVehicleForm(emptyVehicle)
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div className="admin-record-list">
              <table className="admin-data-table">
                <thead>
                  <tr><th>Vehiculo</th><th>Conductor</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {visibleVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td><strong>{vehicle.codigo}</strong><small>Unidad de reparto</small></td>
                      <td>{vehicle.conductor || 'Sin asignar'}</td>
                      <td>{vehicle.capacidad}</td>
                      <td><span className={`vehicle-status vehicle-status-${vehicle.estado.toLowerCase()}`}>{vehicle.estado}</span></td>
                      <td>
                        <div className="admin-record-actions">
                          <button className="secondary-button edit-action" type="button" onClick={() => {
                            setEditingVehicle(vehicle.id)
                            setVehicleForm({ codigo: vehicle.codigo, capacidad: String(vehicle.capacidad), conductorId: vehicle.conductorId ? String(vehicle.conductorId) : '' })
                            setVehicleStatus(vehicle.estado)
                            setModal({ type: 'editVehicle', record: vehicle })
                          }}>Editar</button>
                          <button className="danger-button delete-action" type="button" disabled={vehicle.estado === 'EN_RUTA'} onClick={() => removeRecord(`/vehiculos/${vehicle.id}`, 'Vehiculo eliminado.')}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-table-toolbar">
                <label className="admin-search-box"><span aria-hidden="true">⌕</span><input value={vehicleSearch} onChange={(event) => { setVehicleSearch(event.target.value); setVehiclePage(1) }} placeholder="Buscar por código o conductor" aria-label="Buscar vehículos" /></label>
                <select value={vehicleFilter} aria-label="Filtrar por estado" onChange={(event) => { setVehicleFilter(event.target.value); setVehiclePage(1) }}>
                  <option value="all">Todos los estados</option>
                  {[...new Set(vehicles.map((vehicle) => vehicle.estado))].map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
              <div className="admin-table-head admin-vehicle-head"><span>Vehículo</span><span>Conductor</span><span>Capacidad</span><span>Estado</span><span>Acciones</span></div>
              {visibleVehicles.map((vehicle) => (
                <article className="admin-record admin-vehicle-row" key={vehicle.id}>
                  <div>
                    <strong>{vehicle.codigo}</strong>
                    <p>
                      {vehicle.conductor || 'Sin conductor'} · Capacidad {vehicle.capacidad}
                    </p>
                  </div>
                  <div className="admin-data-cell"><span>Conductor</span><strong>{vehicle.conductor || 'Sin asignar'}</strong></div>
                  <div className="admin-data-cell"><span>Capacidad</span><strong>{vehicle.capacidad}</strong></div>
                  <span className={`vehicle-status vehicle-status-${vehicle.estado.toLowerCase()}`}>
                    {vehicle.estado}
                  </span>
                  <div className="admin-record-actions">
                    <button
                      className="secondary-button edit-action"
                      onClick={() => {
                        setEditingVehicle(vehicle.id)
                        setVehicleForm({
                          codigo: vehicle.codigo,
                          capacidad: String(vehicle.capacidad),
                          conductorId: vehicle.conductorId
                            ? String(vehicle.conductorId)
                            : '',
                        })
                        setVehicleStatus(vehicle.estado)
                        setModal({ type: 'editVehicle', record: vehicle })
                      }}
                    >
                      Editar
                    </button>
                    <select
                      aria-label={`Estado de ${vehicle.codigo}`}
                      value={vehicle.estado}
                      disabled={vehicle.estado === 'EN_RUTA'}
                      onChange={(event) =>
                        runAction(
                          async () => {
                            await readApiResponse(
                              await apiFetch(`/vehiculos/${vehicle.id}/estado`, {
                                method: 'PATCH',
                                body: JSON.stringify({ estado: event.target.value }),
                              }),
                            )
                          },
                          'Estado del vehículo actualizado.',
                        )
                      }
                    >
                      {VEHICLE_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                      {vehicle.estado === 'EN_RUTA' && (
                        <option value="EN_RUTA">EN_RUTA</option>
                      )}
                    </select>
                    <button
                      className="danger-button delete-action"
                      disabled={vehicle.estado === 'EN_RUTA'}
                      onClick={() =>
                        removeRecord(
                          `/vehiculos/${vehicle.id}`,
                          'Vehículo eliminado.',
                        )
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <AdminPagination page={vehiclePage} total={filteredVehicles.length} onChange={setVehiclePage} />
          </section>
        )}

        {tab === 'conductores' && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h3>{editingDriver ? 'Editar conductor' : 'Nuevo conductor'}</h3>
            </div>
            <form className={`admin-form${editingDriver ? ' is-editing' : ''}`} onSubmit={submitDriver}>
              <label>
                Nombre
                <input
                  required
                  maxLength={100}
                  value={driverForm.nombre}
                  onChange={(event) =>
                    setDriverForm({ ...driverForm, nombre: event.target.value })
                  }
                />
              </label>
              <label>
                Teléfono
                <input
                  maxLength={30}
                  value={driverForm.telefono}
                  onChange={(event) =>
                    setDriverForm({ ...driverForm, telefono: event.target.value })
                  }
                />
              </label>
              <label>
                Licencia
                <input
                  maxLength={50}
                  value={driverForm.licencia}
                  onChange={(event) =>
                    setDriverForm({ ...driverForm, licencia: event.target.value })
                  }
                />
              </label>
              <div className="admin-form-actions">
                <button className="refresh-button" disabled={busy}>
                  {editingDriver ? 'Guardar cambios' : 'Crear conductor'}
                </button>
                {editingDriver && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingDriver(null)
                      setDriverForm(emptyDriver)
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {accountDriverId && (
              <form className="admin-form driver-account-form" onSubmit={submitDriverAccount}>
                <h4>
                  Crear acceso para{' '}
                  {drivers.find((driver) => driver.id === accountDriverId)?.nombre}
                </h4>
                <label>
                  Correo de acceso
                  <input
                    required
                    type="email"
                    maxLength={254}
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                  />
                </label>
                <label>
                  Contraseña temporal
                  <input
                    required
                    type="password"
                    minLength={8}
                    maxLength={72}
                    value={accountPassword}
                    onChange={(event) => setAccountPassword(event.target.value)}
                  />
                </label>
                <div className="admin-form-actions">
                  <button className="refresh-button" disabled={busy}>
                    Crear cuenta CONDUCTOR
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setAccountDriverId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="admin-record-list">
              <div className="admin-table-head admin-driver-head"><span>Conductor</span><span>Teléfono</span><span>Licencia</span><span>Estado</span><span>Acciones</span></div>
              <div className="admin-table-toolbar driver-table-toolbar">
                <label className="admin-search-box"><span aria-hidden="true">⌕</span><input value={driverSearch} onChange={(event) => { setDriverSearch(event.target.value); setDriverPage(1) }} placeholder="Buscar por nombre, teléfono o licencia" aria-label="Buscar conductores" /></label>
                <select value={driverFilter} aria-label="Filtrar conductores por estado" onChange={(event) => { setDriverFilter(event.target.value); setDriverPage(1) }}>
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              <table className="admin-data-table admin-driver-table">
                <thead><tr><th>Conductor</th><th>Teléfono</th><th>Licencia</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {visibleDrivers.map((driver) => (
                    <tr key={driver.id}>
                      <td><strong>{driver.nombre}</strong><small>{driver.cuenta?.email || 'Conductor'}</small></td>
                      <td>{driver.telefono || 'Sin teléfono'}</td>
                      <td>{driver.licencia || '—'}</td>
                      <td><span className={`history-count ${driver.activo ? 'driver-active' : 'driver-inactive'}`}>{driver.activo ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div className="admin-record-actions">
                          <button type="button" className="secondary-button edit-action" onClick={() => {
                            setEditingDriver(driver.id)
                            setDriverForm({ nombre: driver.nombre, telefono: driver.telefono || '', licencia: driver.licencia || '' })
                            setModal({ type: 'editDriver', record: driver })
                          }}>Editar</button>
                          <button type="button" className="secondary-button" disabled={busy} onClick={() => runAction(async () => {
                            await readApiResponse(await apiFetch(`/conductores/${driver.id}`, { method: 'PATCH', body: JSON.stringify({ activo: !driver.activo }) }))
                          }, 'Estado del conductor actualizado.')}>{driver.activo ? 'Desactivar' : 'Activar'}</button>
                          {!driver.cuenta && driver.activo && <button type="button" className="secondary-button" disabled={busy} onClick={() => { setAccountDriverId(driver.id); setAccountEmail(''); setAccountPassword('') }}>Crear acceso</button>}
                          <button type="button" className="danger-button delete-action" onClick={() => removeRecord(`/conductores/${driver.id}`, 'Conductor eliminado.')}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleDrivers.map((driver) => (
                <article className="admin-record admin-driver-row" key={driver.id}>
                  <div>
                    <strong>{driver.nombre}</strong>
                    <p>
                      {driver.telefono || 'Sin teléfono'} · Licencia {driver.licencia || '—'}
                      {driver.cuenta && ` · Cuenta: ${driver.cuenta.email}`}
                    </p>
                  </div>
                  <div className="admin-data-cell"><span>Teléfono</span><strong>{driver.telefono || 'Sin teléfono'}</strong></div>
                  <div className="admin-data-cell"><span>Licencia</span><strong>{driver.licencia || '—'}</strong></div>
                  <span className="history-count">
                    {driver.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="admin-record-actions">
                    <button
                      className="secondary-button edit-action"
                      onClick={() => {
                        setEditingDriver(driver.id)
                        setDriverForm({
                          nombre: driver.nombre,
                          telefono: driver.telefono || '',
                          licencia: driver.licencia || '',
                        })
                        setModal({ type: 'editDriver', record: driver })
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() =>
                        runAction(
                          async () => {
                            await readApiResponse(
                              await apiFetch(`/conductores/${driver.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ activo: !driver.activo }),
                              }),
                            )
                          },
                          'Estado del conductor actualizado.',
                        )
                      }
                    >
                      {driver.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    {!driver.cuenta && driver.activo && (
                      <button
                        className="secondary-button"
                        disabled={busy}
                        onClick={() => {
                          setAccountDriverId(driver.id)
                          setAccountEmail('')
                          setAccountPassword('')
                        }}
                      >
                        Crear acceso
                      </button>
                    )}
                    <button
                      className="danger-button delete-action"
                      onClick={() =>
                        removeRecord(
                          `/conductores/${driver.id}`,
                          'Conductor eliminado.',
                        )
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <AdminPagination page={driverPage} total={filteredDrivers.length} onChange={setDriverPage} />
          </section>
        )}

        {tab === 'usuarios' && isSuperadmin && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h3>{section === 'create-user' ? 'Datos del usuario' : 'Cuentas y roles'}</h3>
              <p>{section === 'create-user' ? 'Ingresa los datos para crear una nueva cuenta.' : 'Administra las cuentas y roles del sistema.'}</p>
            </div>
            <form className="admin-form user-create-form" onSubmit={submitUser}>
              <label>
                Nombre completo
                <input required maxLength={120} value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} />
              </label>
              <label>
                Correo electrónico
                <input required type="email" maxLength={254} value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
              </label>
              <label>
                Contraseña temporal
                <input required type="password" minLength={8} maxLength={72} value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} />
              </label>
              {section !== 'create-user' && (
                <label>
                  Rol inicial
                  <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                    {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
              )}
              <div className="admin-form-actions">
                <button className="refresh-button" disabled={busy}>Crear usuario</button>
              </div>
            </form>
            <div className="admin-record-list">
              <div className="admin-table-head admin-user-head"><span>Usuario</span><span>Rol</span><span>Estado</span><span>Acciones</span></div>
              <div className="admin-table-toolbar user-table-toolbar">
                <label className="admin-search-box"><span aria-hidden="true">⌕</span><input value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserPage(1) }} placeholder="Buscar por nombre o correo" aria-label="Buscar usuarios" /></label>
                <select value={userRoleFilter} aria-label="Filtrar usuarios por rol" onChange={(event) => { setUserRoleFilter(event.target.value); setUserPage(1) }}>
                  <option value="all">Todos los roles</option>
                  {['SUPERADMIN', ...USER_ROLES, 'CONDUCTOR'].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <select value={userStatusFilter} aria-label="Filtrar usuarios por estado" onChange={(event) => { setUserStatusFilter(event.target.value); setUserPage(1) }}>
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
              <table className="admin-data-table admin-user-table">
                <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {visibleUsers.map((account) => (
                    <tr key={account.id}>
                      <td><strong>{account.name}</strong></td>
                      <td>{account.email}</td>
                      <td><span className="role-name-badge">{account.role}</span></td>
                      <td><span className={`history-count ${account.active ? 'driver-active' : 'driver-inactive'}`}>{account.active ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div className="admin-record-actions">
                          <button type="button" className="secondary-button edit-action" disabled={account.role === 'SUPERADMIN' || busy} onClick={() => {
                            setUserRole(account.role)
                            setModal({ type: 'editRole', record: account })
                          }}>Editar rol</button>
                          <button type="button" className="secondary-button" disabled={account.role === 'SUPERADMIN' || busy} onClick={() => updateUser(account.id, `/users/${account.id}/status`, { active: !account.active }, 'Estado de la cuenta actualizado.')}>{account.active ? 'Desactivar' : 'Activar'}</button>
                          <button type="button" className="danger-button delete-action" disabled={account.role === 'SUPERADMIN' || busy} onClick={() => removeRecord(`/users/${account.id}`, 'Usuario eliminado.')}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleUsers.map((account) => (
                <article className="admin-record admin-user-row" key={account.id}>
                  <div>
                    <strong>{account.name}</strong>
                    <p>{account.email}</p>
                  </div>
                  <select
                    value={account.role}
                    disabled={account.role === 'SUPERADMIN' || busy}
                    onChange={(event) =>
                      updateUser(
                        account.id,
                        `/users/${account.id}/role`,
                        { role: event.target.value },
                        'Rol actualizado.',
                      )
                    }
                    aria-label={`Rol de ${account.name}`}
                  >
                    {account.role === 'CONDUCTOR' && (
                      <option value="CONDUCTOR" disabled>
                        CONDUCTOR · vinculado al registro
                      </option>
                    )}
                    {['SUPERADMIN', ...USER_ROLES].map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <span className="role-name-badge">{account.role}</span>
                  <span className="history-count">
                    {account.active ? 'Activo' : 'Desactivado'}
                  </span>
                  <div className="admin-record-actions">
                    <button
                      className="secondary-button edit-action"
                      disabled={account.role === 'SUPERADMIN' || busy}
                      onClick={() => {
                        setUserRole(account.role)
                        setModal({ type: 'editRole', record: account })
                      }}
                    >
                      Editar rol
                    </button>
                    <button
                      className="secondary-button"
                      disabled={account.role === 'SUPERADMIN' || busy}
                      onClick={() =>
                        updateUser(
                          account.id,
                          `/users/${account.id}/status`,
                          { active: !account.active },
                          'Estado de la cuenta actualizado.',
                        )
                      }
                    >
                      {account.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className="danger-button delete-action"
                      disabled={account.role === 'SUPERADMIN' || busy}
                      onClick={() =>
                        removeRecord(`/users/${account.id}`, 'Usuario eliminado.')
                      }
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <AdminPagination page={userPage} total={filteredUsers.length} onChange={setUserPage} />
          </section>
        )}

        {modal && (
          <div
            className="admin-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal()
            }}
          >
            <section className="admin-modal" data-vehicle-running={modal.type === 'editVehicle' && modal.record.estado === 'EN_RUTA' ? 'true' : 'false'} role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
              <header className="admin-modal-header">
                <div>
                  <span className="eyebrow">ROUTEMIND · ADMIN</span>
                  <h2 id="admin-modal-title">
                    {modal.type === 'delete' ? modal.title
                      : modal.type === 'editVehicle' ? 'Editar vehículo'
                        : modal.type === 'editDriver' ? 'Editar conductor'
                          : 'Editar rol de usuario'}
                  </h2>
                </div>
                <button className="admin-modal-close" type="button" aria-label="Cerrar" onClick={closeModal}>×</button>
              </header>
              {error && <div className="message error-message admin-modal-error" role="alert">{error}</div>}

              {modal.type === 'editVehicle' && (
                <>
                  <form className="admin-modal-form" onSubmit={submitVehicle}>
                    <label>Código<input required maxLength={20} value={vehicleForm.codigo} onChange={(event) => setVehicleForm({ ...vehicleForm, codigo: event.target.value })} /></label>
                    <label>Capacidad<input required type="number" min="1" value={vehicleForm.capacidad} onChange={(event) => setVehicleForm({ ...vehicleForm, capacidad: event.target.value })} /></label>
                    <label>Conductor<select value={vehicleForm.conductorId} onChange={(event) => setVehicleForm({ ...vehicleForm, conductorId: event.target.value })}><option value="">Sin asignar</option>{drivers.filter((driver) => driver.activo).map((driver) => <option key={driver.id} value={driver.id}>{driver.nombre}</option>)}</select></label>
                    <label>Estado<select value={vehicleStatus} disabled={modal.record.estado === 'EN_RUTA'} onChange={(event) => setVehicleStatus(event.target.value)}>{VEHICLE_STATES.map((state) => <option key={state} value={state}>{state}</option>)}{modal.record.estado === 'EN_RUTA' && <option value="EN_RUTA">EN_RUTA</option>}</select></label>
                    <div className="admin-modal-actions">
                      <button type="button" className="secondary-button" onClick={closeModal}>Cancelar</button>
                      <button className="refresh-button" disabled={busy}>Guardar cambios</button>
                    </div>
                  </form>
                  <button className="modal-delete-button" type="button" disabled={busy} onClick={() => removeRecord(`/vehiculos/${modal.record.id}`, 'Vehículo eliminado.')}>Eliminar vehículo</button>
                </>
              )}

              {modal.type === 'editDriver' && (
                <>
                  <form className="admin-modal-form" onSubmit={submitDriver}>
                    <label>Nombre<input required maxLength={100} value={driverForm.nombre} onChange={(event) => setDriverForm({ ...driverForm, nombre: event.target.value })} /></label>
                    <label>Teléfono<input maxLength={30} value={driverForm.telefono} onChange={(event) => setDriverForm({ ...driverForm, telefono: event.target.value })} /></label>
                    <label>Licencia<input maxLength={50} value={driverForm.licencia} onChange={(event) => setDriverForm({ ...driverForm, licencia: event.target.value })} /></label>
                    <div className="admin-modal-actions">
                      <button type="button" className="secondary-button" onClick={closeModal}>Cancelar</button>
                      <button className="refresh-button" disabled={busy}>Guardar cambios</button>
                    </div>
                  </form>
                  <button className="modal-delete-button" type="button" disabled={busy} onClick={() => removeRecord(`/conductores/${modal.record.id}`, 'Conductor eliminado.')}>Eliminar conductor</button>
                </>
              )}

              {modal.type === 'editRole' && (
                <form className="admin-modal-form" onSubmit={saveUserRole}>
                  <p className="admin-modal-copy">Elige los permisos que tendrá <strong>{modal.record.name}</strong>.</p>
                  <label>Rol<select value={userRole} onChange={(event) => setUserRole(event.target.value)}>{USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select></label>
                  <div className="admin-modal-actions">
                    <button type="button" className="secondary-button" onClick={closeModal}>Cancelar</button>
                    <button className="refresh-button" disabled={busy}>Guardar cambios</button>
                  </div>
                  <button className="modal-delete-button" type="button" disabled={busy} onClick={() => removeRecord(`/users/${modal.record.id}`, 'Usuario eliminado.')}>Eliminar usuario</button>
                </form>
              )}

              {modal.type === 'delete' && (
                <div className="admin-delete-confirm">
                  <div className="admin-delete-icon">!</div>
                  <p>{modal.message}</p>
                  <div className="admin-modal-actions">
                    <button type="button" className="secondary-button" onClick={closeModal}>Cancelar</button>
                    <button type="button" className="danger-button" disabled={busy} onClick={confirmRemove}>{busy ? 'Eliminando...' : 'Sí, eliminar'}</button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  )
}
