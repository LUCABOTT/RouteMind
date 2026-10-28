function Sidebar({ user, onLogout }) {
  const isAdmin = ['SUPERADMIN', 'ADMIN'].includes(user?.role)

  return (
    <aside className="topbar" aria-label="Navegación lateral">
      <div className="brand">
        <div className="brand-icon">R</div>
        <div>
          <h1>RouteMind</h1>
          <p>Planificación logística inteligente</p>
        </div>
      </div>

      <nav className="topbar-nav" aria-label="Navegación principal">
        <a href={isAdmin ? '/dashboard' : '#overview'}>Dashboard</a>
        <a className="active" href="/planner">Route Optimizer</a>
        <a href="#history">Routes</a>
        {isAdmin && (
          <>
            <a href="/vehicles">Vehículos</a>
            <a href="/vehicles/new">Crear vehículo</a>
            <a href="/drivers">Conductores</a>
            <a href="/drivers/new">Crear conductor</a>
            {user?.role === 'SUPERADMIN' && (
              <>
                <a href="/users/new">Crear usuario</a>
                <a href="/users/roles">Cuentas y roles</a>
              </>
            )}
          </>
        )}
      </nav>

      <span className="system-status">
        <span /> Sistema de rutas
      </span>

      <div className="topbar-user">
        <span className="user-avatar" aria-hidden="true">
          {user?.name?.slice(0, 2)?.toUpperCase() || 'RM'}
        </span>
        <span className="sidebar-user-copy">
          {user?.name}
          <small>{user?.role}</small>
        </span>
        <span>{user?.name} · {user?.role}</span>
        {isAdmin && <a href="/dashboard">Dashboard</a>}
        <button type="button" onClick={onLogout}>
          Salir
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
