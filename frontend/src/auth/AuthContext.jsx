import { useEffect, useMemo, useState } from 'react'
import { apiFetch, readApiResponse } from '../utils/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let mounted = true
    apiFetch('/auth/me')
      .then(async (response) => {
        if (response.status === 401) return null
        const data = await readApiResponse(response)
        return data.user
      })
      .then((currentUser) => {
        if (mounted) {
          setAuthError('')
          setUser(currentUser)
        }
      })
      .catch((error) => {
        if (mounted) {
          setAuthError(error.message)
          setUser(null)
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      async login(credentials) {
        setAuthError('')
        const data = await readApiResponse(
          await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          }),
        )
        setUser(data.user)
        return data.user
      },
      async register(credentials) {
        setAuthError('')
        const data = await readApiResponse(
          await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
          }),
        )
        setUser(data.user)
        return data.user
      },
      async logout() {
        setAuthError('')
        await readApiResponse(
          await apiFetch('/auth/logout', { method: 'POST' }),
        )
        setUser(null)
      },
    }),
    [authError, loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
