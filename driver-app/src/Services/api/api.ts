const API_URL = import.meta.env.VITE_API_URL;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || 'Error al comunicarse con el servidor';

    throw new Error(message);
  }

  return data as T;
}