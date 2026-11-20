import { Capacitor } from '@capacitor/core';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL =
  configuredApiUrl ||
  (Capacitor.getPlatform() === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api');
const REQUEST_TIMEOUT_MS = 15000;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const formDataBody =
    options.body instanceof FormData ? options.body : null;
  const headers: HeadersInit = formDataBody
    ? {}
    : { 'Content-Type': 'application/json' };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? REQUEST_TIMEOUT_MS,
  );
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: options.method ?? 'GET',
      headers,
      body: formDataBody
        ? formDataBody
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted) {
      throw new Error(
        'El servidor no respondió a tiempo. Verifica la conexión con el backend e inténtalo de nuevo.',
      );
    }

    throw new Error(
      'No fue posible conectar con el servidor. Verifica que el backend esté activo y que la URL sea accesible desde el dispositivo.',
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Error al comunicarse con el servidor';

    throw new Error(message);
  }

  return data as T;
}
