import type { H3Event } from 'h3'
import { describe, expect, it } from 'vitest'
import {
  attachRequestTelemetry,
  createErrorLog,
  createRequestLog,
  shouldLogRequest,
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
})
