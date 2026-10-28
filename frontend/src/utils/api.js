const apiHost = window.location.hostname.includes(':')
  ? `[${window.location.hostname}]`
  : window.location.hostname
const defaultApiUrl = `${window.location.protocol}//${apiHost}:3000/api`

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl

export const apiFetch = (path, options = {}) =>
  fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

export async function readApiResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message
    throw new Error(message || 'La solicitud no se pudo completar.')
  }
  return data
}
