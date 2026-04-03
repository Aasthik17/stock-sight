const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() ?? '').replace(/\/+$/, '')

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = configuredBaseUrl || '/api'
  return `${baseUrl}${normalizedPath}`
}
