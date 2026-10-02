const CACHE_KEY = 'rutalocal-cache-v1';

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCache(key, data) {
  const cache = readCache();
  cache[key] = data;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

export async function request(path, { method = 'GET', body, cacheKey } = {}) {
  const token = localStorage.getItem('rf-token');
  try {
    const response = await fetch(apiUrl(path), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body == null ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.mensaje || 'No pudimos completar la solicitud.');
      error.status = response.status;
      throw error;
    }
    if (cacheKey) writeCache(cacheKey, data);
    return data;
  } catch (error) {
    if (cacheKey && (error instanceof TypeError || !navigator.onLine)) {
      const cached = readCache()[cacheKey];
      if (cached) return { ...cached, desdeCache: true };
    }
    throw error;
  }
}

export const api = {
  get: (path, cacheKey) => request(path, { cacheKey }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
