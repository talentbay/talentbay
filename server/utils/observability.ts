import type { H3Event } from 'h3'

type RequestTelemetry = {
  requestId: string
  startedAt: number
  method: string
  path: string
  operation?: RequestOperation
  result?: 'replayed' | 'invalid' | 'failed'
}

const requestOperations = ['application.handling', 'vacancy.file.preview', 'vacancy.file.import', 'source.fetch', 'source.preview', 'source.import'] as const
type RequestOperation = typeof requestOperations[number]

type RequestLog = {
  timestamp: string
  level: 'info'
  event: 'request.completed'
  requestId: string
  method: string
  path: string
  statusCode: number
  durationMs: number
  operation?: RequestOperation
  result?: 'completed' | 'replayed' | 'invalid' | 'conflict' | 'denied' | 'unavailable' | 'failed'
}

type ErrorLog = {
  timestamp: string
  level: 'error'
  event: 'request.error'
  requestId?: string
  method?: string
  path?: string
  source: string
  errorType: string
  statusCode?: number
}

type TelemetryContext = {
  talentBayTelemetry?: RequestTelemetry
}

function getPathname(requestUrl: string) {
  try { return new URL(requestUrl, 'http://localhost').pathname }
  catch { return '/' }
}

const staticPaths = new Set([
  '/api/health', '/api/_auth/session',
  '/api/v1/vacancies', '/api/v1/vacancies/resolve', '/api/v1/profile', '/api/v1/applications',
  '/api/v1/relocation/locations', '/api/v1/relocation/preview', '/api/v1/bot/telegram',
  '/api/v1/auth/google', '/api/v1/auth/github', '/api/v1/auth/telegram', '/api/v1/auth/link', '/api/v1/auth/identities', '/api/v1/auth/capabilities',
  '/api/v1/admin/dashboard', '/api/v1/admin/users', '/api/v1/admin/applications',
  '/api/v1/admin/vacancies', '/api/v1/admin/vacancies/import', '/api/v1/admin/vacancies/file',
  '/api/v1/admin/sources', '/api/v1/admin/sources/progress', '/api/v1/admin/sources/run',
])
const dynamicPaths: [RegExp, string][] = [
  [/^\/api\/v1\/vacancies\/[^/]+$/, '/api/v1/vacancies/:slug'],
  [/^\/api\/v1\/vacancies\/[^/]+\/application$/, '/api/v1/vacancies/:id/application'],
  [/^\/api\/v1\/vacancies\/[^/]+\/applications$/, '/api/v1/vacancies/:id/applications'],
  [/^\/api\/v1\/applications\/[^/]+\/progress$/, '/api/v1/applications/:id/progress'],
  [/^\/api\/v1\/applications\/[^/]+\/withdraw$/, '/api/v1/applications/:id/withdraw'],
  [/^\/api\/v1\/admin\/applications\/[^/]+$/, '/api/v1/admin/applications/:id'],
  [/^\/api\/v1\/admin\/applications\/[^/]+\/handling$/, '/api/v1/admin/applications/:id/handling'],
  [/^\/api\/v1\/admin\/applications\/[^/]+\/package$/, '/api/v1/admin/applications/:id/package'],
  [/^\/api\/v1\/admin\/vacancies\/[^/]+$/, '/api/v1/admin/vacancies/:id'],
]

export function telemetryPath(requestUrl: string) {
  const path = getPathname(requestUrl)
  if (staticPaths.has(path)) return path
  if (path.length <= 2048) for (const [pattern, template] of dynamicPaths) if (pattern.test(path)) return template
  return '/api/:unmatched'
}

function getErrorStatusCode(error: unknown) {
  if (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && typeof error.statusCode === 'number'
    && Number.isInteger(error.statusCode) && error.statusCode >= 100 && error.statusCode <= 599
  ) {
    return error.statusCode
  }
}

export function shouldLogRequest(requestUrl: string) {
  return getPathname(requestUrl).startsWith('/api/')
}

export function attachRequestTelemetry(
  event: H3Event,
  requestId: string,
  startedAt = Date.now(),
) {
  const telemetry: RequestTelemetry = {
    requestId,
    startedAt,
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(event.method) ? event.method : 'OTHER',
    path: telemetryPath(event.path),
  }

  ;(event.context as TelemetryContext).talentBayTelemetry = telemetry
  return telemetry
}

export function setRequestOperation(event: H3Event, operation: RequestOperation, result?: RequestTelemetry['result']) {
  const telemetry = getRequestTelemetry(event)
  if (!telemetry || !requestOperations.includes(operation)) return
  telemetry.operation = operation
  telemetry.result = result && ['replayed', 'invalid', 'failed'].includes(result) ? result : undefined
}

export function getRequestTelemetry(event?: H3Event) {
  return event
    ? (event.context as TelemetryContext).talentBayTelemetry
    : undefined
}

export function createRequestLog(
  telemetry: RequestTelemetry,
  statusCode: number,
  completedAt = Date.now(),
): RequestLog {
  return {
    timestamp: new Date(completedAt).toISOString(),
    level: 'info',
    event: 'request.completed',
    requestId: telemetry.requestId,
    method: telemetry.method,
    path: telemetry.path,
    statusCode,
    durationMs: Math.max(0, completedAt - telemetry.startedAt),
    operation: telemetry.operation,
    result: operationResult(telemetry, statusCode),
  }
}

function operationResult(telemetry: RequestTelemetry, statusCode: number): RequestLog['result'] {
  if (!telemetry.operation) return undefined
  if (statusCode === 503) return 'unavailable'
  if (statusCode >= 500) return 'failed'
  if (statusCode === 409) return 'conflict'
  if (statusCode === 401 || statusCode === 403) return 'denied'
  if (statusCode >= 400) return 'invalid'
  return telemetry.result ?? 'completed'
}

export function createErrorLog(
  error: unknown,
  source: string,
  event?: H3Event,
  occurredAt = Date.now(),
): ErrorLog {
  const telemetry = getRequestTelemetry(event)
  const errorType = error instanceof Error
    ? ['Error', 'TypeError', 'RangeError', 'SyntaxError', 'URIError', 'AbortError', 'TimeoutError', 'H3Error', 'PostgresError', 'ZodError', 'DrizzleQueryError'].includes(error.name) ? error.name : 'Error'
    : 'UnknownError'
  const statusCode = getErrorStatusCode(error)

  return {
    timestamp: new Date(occurredAt).toISOString(),
    level: 'error',
    event: 'request.error',
    requestId: telemetry?.requestId,
    method: telemetry?.method,
    path: telemetry?.path,
    source: ['nitro', 'oauth.google', 'oauth.github'].includes(source) ? source : 'application',
    errorType,
    statusCode,
  }
}

export function writeStructuredLog(record: RequestLog | ErrorLog) {
  const line = JSON.stringify(record)

  if (record.level === 'error') {
    console.error(line)
    return
  }

  console.info(line)
}

export function logHandledRequestError(
  event: H3Event,
  error: unknown,
  source: string,
) {
  writeStructuredLog(createErrorLog(error, source, event))
}
