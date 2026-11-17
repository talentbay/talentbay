import { describe, expect, it } from 'vitest'
import { isApiRequest, isPrivateApiRequest, safeApiFailure } from '#server/utils/private-api'

describe('private API response boundary', () => {
  it('classifies raw separators and dot segments as API paths, not URL authorities', () => {
    for (const path of [
      '//api/v1/profile', '//api/v1/admin/dashboard', '/api//v1/profile', '/api/v1//admin/dashboard',
      '/api/v1/./profile', '/api/v1/ignored/../admin/dashboard', '/api/v1/%2e/profile',
      '/api/v1/ignored/%2e%2e/admin/dashboard', '/api%2fv1%2fprofile', '/api/v1%2Fadmin%2Fdashboard', '/api/v1/admin%2fdashboard',
    ]) {
      expect(isApiRequest(path), path).toBe(true)
      expect(isPrivateApiRequest(`${path}?private=not-for-errors`), path).toBe(true)
    }
    for (const path of ['//attacker.invalid/', '/jobs', '/api-other/profile']) expect(isApiRequest(path), path).toBe(false)
  })
  it('covers private endpoint variants without disabling public list caching', () => {
    for (const path of ['/api/_auth/session', '/api/v1/relocation/preview?annualGross=60000', '/api/v1/profile/?invalid=1', '/API/v1/applications/42/progress', '/api/v1/auth/link', '/api/v1/admin/applications/42', '/api/v1/vacancies/42/application', '/api/v1/vacancies/42/applications']) expect(isPrivateApiRequest(path), path).toBe(true)
    for (const path of ['/api/v1/vacancies', '/api/v1/vacancies/my-role', '/api/v1/relocation/locations', '/jobs', '/api/v1/applications-other']) expect(isPrivateApiRequest(path), path).toBe(false)
    expect(isApiRequest('/api/unregistered')).toBe(true)
    expect(isApiRequest('/jobs/role')).toBe(false)
  })
  it('preserves valid HTTP failure status, never private messages/data/SQL/URL/stack', () => {
    const error = { statusCode: 404, message: 'PRIVATE_MESSAGE', statusMessage: 'PRIVATE_STATUS', stack: 'PRIVATE_STACK', data: { email: 'PRIVATE_EMAIL' }, url: '/PRIVATE_URL' }
    const result = safeApiFailure(error)
    expect(result).toEqual({ status: 404, body: { error: true, statusCode: 404, statusMessage: 'Resource not found', message: 'Resource not found' } })
    expect(JSON.stringify(result)).not.toContain('PRIVATE')
    for (const statusCode of [NaN, Infinity, 200, 600, '403', undefined]) expect(safeApiFailure({ statusCode }).status).toBe(500)
    expect(safeApiFailure({ statusCode: 418 }).body.message).toBe('Request failed')
    expect(safeApiFailure({ statusCode: 503 }).status).toBe(503)
    const authError = { statusCode: 401, data: { telegramAuthFailure: 'expired' } }
    expect(safeApiFailure(authError).body).toEqual({ error: true, statusCode: 401, statusMessage: 'Authentication required', message: 'Authentication required' })
  })
})
