import { candidateReviewRequiredCode } from '#shared/types/candidates'

function pathname(value: string) {
  try {
    // Classify origin-form targets conservatively; never use this to rewrite routing/auth.
    const target = value.startsWith('/') ? `http://localhost${value}` : value
    const path = new URL(target, 'http://localhost').pathname.replace(/%2f|%5c/gi, '/').replace(/\/+/g, '/')
    return new URL(`http://localhost${path}`).pathname.toLowerCase().replace(/\/+$/, '')
  }
  catch { return '' }
}

export function isApiRequest(value: string) {
  const path = pathname(value)
  return path === '/api' || path.startsWith('/api/')
}

export function isPrivateApiRequest(value: string) {
  const path = pathname(value)
  return path === '/api/_auth/session'
    || path === '/api/v1/relocation/preview'
    || path === '/api/v1/profile'
    || path === '/api/v1/applications' || path.startsWith('/api/v1/applications/')
    || path === '/api/v1/admin' || path.startsWith('/api/v1/admin/')
    || path.startsWith('/api/v1/auth/')
    || /^\/api\/v1\/vacancies\/[^/]+\/applications?$/.test(path)
}

const messages: Record<number, string> = {
  400: 'Invalid request', 401: 'Authentication required', 403: 'Forbidden', 404: 'Resource not found',
  409: 'Request conflicts with current state', 412: 'Review the changed resource', 413: 'JSON request is too large', 415: 'Use uncompressed application/json',
  422: 'Invalid request data', 429: 'Too many requests', 500: 'Service unavailable', 503: 'Service unavailable',
}

export function safeApiFailure(error: { statusCode?: unknown; data?: unknown }) {
  const value = error.statusCode
  const status = typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599 ? value : 500
  const statusMessage = messages[status] ?? 'Request failed'
  const data = error.data
  const staleCandidate = status === 412 && data !== null && typeof data === 'object' && !Array.isArray(data)
    && Object.getOwnPropertyDescriptor(data, 'code')?.value === candidateReviewRequiredCode
  return { status, body: { error: true, statusCode: status, statusMessage, message: statusMessage, ...(staleCandidate ? { code: candidateReviewRequiredCode } : {}) } }
}
