import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import {
  attachRequestTelemetry,
  createErrorLog,
  createRequestLog,
  shouldLogRequest,
  setRequestOperation,
  telemetryPath,
} from '../../server/utils/observability'

function createEvent(path: string, method = 'GET') {
  return {
    context: {},
    method,
    path,
  } as H3Event
}

describe('observability', () => {
  it('logs API requests without query parameters', () => {
    const event = createEvent('/api/v1/vacancies?email=private@example.com')
    const telemetry = attachRequestTelemetry(event, 'request-1', 1_000)
    const log = createRequestLog(telemetry, 200, 1_125)

    expect(log).toMatchObject({
      requestId: 'request-1',
      method: 'GET',
      path: '/api/v1/vacancies',
      statusCode: 200,
      durationMs: 125,
    })
    expect(JSON.stringify(log)).not.toContain('private@example.com')
  })

  it('does not select page or asset requests for access logs', () => {
    expect(shouldLogRequest('/jobs')).toBe(false)
    expect(shouldLogRequest('/_nuxt/app.js')).toBe(false)
    expect(shouldLogRequest('/api/v1/vacancies')).toBe(true)
  })

  it('does not copy error messages into structured logs', () => {
    const event = createEvent('/api/v1/auth/google?code=secret')
    attachRequestTelemetry(event, 'request-2', 2_000)

    const error = Object.assign(
      new Error('OAuth token secret must never be logged'),
      { statusCode: 401 },
    )
    const log = createErrorLog(error, 'oauth.google', event, 2_100)

    expect(log).toMatchObject({
      requestId: 'request-2',
      path: '/api/v1/auth/google',
      source: 'oauth.google',
      errorType: 'Error',
      statusCode: 401,
    })
    expect(JSON.stringify(log)).not.toContain('OAuth token secret')
  })

  it('never records supplied path identities, slugs, unknown endpoints or error names', () => {
    for (const path of ['/api/v1/vacancies/private%40example.invalid?code=SECRET', '/api/v1/admin/applications/123456/package', '/api/SECRET/private@example.invalid', '/api/' + 'PRIVATE'.repeat(1000)]) {
      const event = createEvent(path)
      const telemetry = attachRequestTelemetry(event, 'request-3')
      const error = Object.assign(new Error('SECRET_MESSAGE'), { name: 'PRIVATE_NAME_SECRET', statusCode: NaN })
      const text = JSON.stringify([createRequestLog(telemetry, 503), createErrorLog(error, 'PRIVATE_SOURCE', event)])
      for (const value of ['PRIVATE', 'SECRET', 'private%40', '123456', 'private@example.invalid']) expect(text).not.toContain(value)
    }
    expect(telemetryPath('/api/v1/admin/applications/123/package')).toBe('/api/v1/admin/applications/:id/package')
    expect(telemetryPath('/api/v1/vacancies/resolve')).toBe('/api/v1/vacancies/resolve')
    expect(telemetryPath('/api/v1/applications/123456')).toBe('/api/v1/applications/:id')
  })

  it('uses fixed operation/outcome fields and never equates completed HTTP with delivery', () => {
    const event = createEvent('/api/v1/admin/applications/123/handling', 'POST')
    const telemetry = attachRequestTelemetry(event, 'request-4', 1000)
    setRequestOperation(event, 'application.handling', 'replayed')
    expect(createRequestLog(telemetry, 200, 1200)).toMatchObject({ operation: 'application.handling', result: 'replayed', durationMs: 200 })
    for (const [status, result] of [[409, 'conflict'], [403, 'denied'], [422, 'invalid'], [503, 'unavailable'], [500, 'failed']] as const) {
      expect(createRequestLog(telemetry, status).result).toBe(result)
    }
    setRequestOperation(event, 'vacancy.file.preview', 'invalid')
    expect(createRequestLog(telemetry, 200).result).toBe('invalid')
    setRequestOperation(event, 'source.fetch', 'failed')
    expect(createRequestLog(telemetry, 200).result).toBe('failed')
    setRequestOperation(event, 'source.preview')
    expect(createRequestLog(telemetry, 200).result).toBe('completed')
  })

  it('records only allowlisted Telegram rejection stages, never arbitrary error data', () => {
    const event = createEvent('/api/v1/auth/telegram', 'POST')
    attachRequestTelemetry(event, 'auth-rejection')
    for (const reason of ['payload', 'duplicate', 'format', 'expired', 'future', 'hmac', 'user_json', 'user_schema']) {
      const error = { statusCode: 401, data: { telegramAuthFailure: reason, initData: 'PRIVATE_LAUNCH', user: 'PRIVATE_USER' } }
      const log = createErrorLog(error, 'nitro', event)
      expect(log).toMatchObject({ telegramAuthFailure: reason })
      expect(JSON.stringify(log)).not.toContain('PRIVATE')
    }
    const unexpected = { statusCode: 401, data: { telegramAuthFailure: 'PRIVATE_VALUE' } }
    expect(JSON.stringify(createErrorLog(unexpected, 'nitro', event))).not.toContain('PRIVATE_VALUE')
    const other = createEvent('/api/v1/profile')
    attachRequestTelemetry(other, 'not-auth')
    expect(createErrorLog({ statusCode: 401, data: { telegramAuthFailure: 'expired' } }, 'nitro', other)).not.toHaveProperty('telegramAuthFailure')
  })
})
