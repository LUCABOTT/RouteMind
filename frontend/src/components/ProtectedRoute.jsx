import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <main className="auth-loading">Verificando sesión...</main>
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'CONDUCTOR' ? '/driver' : '/planner'}
        replace
      />
    )
  }
  return children
}
