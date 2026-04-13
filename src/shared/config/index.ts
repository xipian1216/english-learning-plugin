export const API_BASE_URL = 'http://localhost:8000'
export const API_PREFIX = '/api/v1'

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${API_PREFIX}${path}`
}
