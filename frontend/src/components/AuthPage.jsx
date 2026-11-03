import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></svg>
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
}

export default function AuthPage({ register = false }) {
  const { authError, login, register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = register
        ? await createAccount({ name, email, password })
        : await login({ email, password })
      navigate(
        user.role === 'CONDUCTOR'
          ? '/driver'
          : ['SUPERADMIN', 'ADMIN'].includes(user.role)
            ? '/dashboard'
            : '/planner',
        { replace: true },
      )
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className={`auth-card${register ? ' auth-card-register' : ''}`}>
        <div className="auth-brand" aria-label="RouteMind">
          <div className="auth-mark">R</div>
        </div>
        {register && <h1 className="auth-title">Crear cuenta</h1>}

        {(authError || error) && (
          <div className="message error-message" role="alert">{error || authError}</div>
        )}

        <form className="auth-form" onSubmit={submit}>
          {register && (
            <label className="auth-input-wrap">
              <span className="sr-only">Nombre completo</span>
              <input
                autoComplete="name"
                maxLength={120}
                placeholder="Nombre completo"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          <label className="auth-input-wrap">
            <span className="auth-input-icon"><MailIcon /></span>
            <span className="sr-only">Correo electrónico</span>
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="Correo electrónico"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="auth-input-wrap">
            <span className="auth-input-icon"><LockIcon /></span>
            <span className="sr-only">Contraseña</span>
            <input
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              minLength={8}
              maxLength={72}
              placeholder="Contraseña"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            className="auth-submit"
            type="submit"
            aria-label={register ? 'Crear cuenta' : 'Iniciar sesión'}
            disabled={submitting}
          >
            {submitting ? <span className="auth-spinner" /> : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            )}
          </button>
        </form>

        <div className="auth-switch">
          {register ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
          <Link to={register ? '/login' : '/register'}>{register ? 'Iniciar sesión' : 'Regístrate'}</Link>
        </div>
      </section>
    </main>
  )
}
