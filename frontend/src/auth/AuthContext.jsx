import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { API_URL, apiFetch, readApiResponse } from '../utils/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [realtimeError, setRealtimeError] = useState('')

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

  useEffect(() => {
    if (!user) return undefined

    const socketOrigin = import.meta.env.DEV
      ? window.location.origin
      : new URL(API_URL, window.location.origin).origin
    const socket = io(socketOrigin, {
      path: '/socket.io',
      withCredentials: true,
    })
    const publish = (name, detail) => {
      window.dispatchEvent(new CustomEvent(name, { detail }))
    }

    socket.on('connect', () => {
      setRealtimeError('')
      publish('routemind:reconnected')
    })
    socket.on('connect_error', (error) => {
      setRealtimeError(
        `No se pudo conectar a las actualizaciones en vivo: ${error.message}`,
      )
    })
    socket.on('route.updated', (detail) => {
      publish('routemind:route-updated', detail)
    })
    socket.on('vehicle.location.updated', (detail) => {
      publish('routemind:location-updated', detail)
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      realtimeError,
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
    [authError, loading, realtimeError, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
