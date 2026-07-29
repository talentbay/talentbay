import type { H3Event } from 'h3'

type RequestTelemetry = {
  requestId: string
  startedAt: number
  method: string
  path: string
}

type RequestLog = {
  timestamp: string
  level: 'info'
  event: 'request.completed'
  requestId: string
  method: string
  path: string
  statusCode: number
  durationMs: number
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
  return new URL(requestUrl, 'http://localhost').pathname
}

function sanitizeToken(value: string, fallback: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 64)
  return sanitized || fallback
}

function getErrorStatusCode(error: unknown) {
  if (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
    && typeof error.statusCode === 'number'
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
    method: event.method,
    path: getPathname(event.path),
  }

  ;(event.context as TelemetryContext).talentBayTelemetry = telemetry
  return telemetry
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
  }
}

export function createErrorLog(
  error: unknown,
  source: string,
  event?: H3Event,
  occurredAt = Date.now(),
): ErrorLog {
  const telemetry = getRequestTelemetry(event)
  const errorType = error instanceof Error
    ? sanitizeToken(error.name, 'Error')
    : 'UnknownError'
  const statusCode = getErrorStatusCode(error)

  return {
    timestamp: new Date(occurredAt).toISOString(),
    level: 'error',
    event: 'request.error',
    requestId: telemetry?.requestId,
    method: telemetry?.method,
    path: telemetry?.path,
    source: sanitizeToken(source, 'application'),
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
