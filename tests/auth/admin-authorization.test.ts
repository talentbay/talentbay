import { createApp, createError, eventHandler, toWebHandler } from 'h3'
import type { EventHandler } from 'h3'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdminSession } from '#server/utils/admin-session'

const { currentAdmin, domainOperation } = vi.hoisted(() => ({ currentAdmin: vi.fn(), domainOperation: vi.fn() }))
vi.mock('#server/services/auth/authorization', () => ({ requireCurrentAdmin: currentAdmin }))
vi.mock('#server/services/admin/dashboard', () => ({ getAdminDashboard: domainOperation }))
vi.mock('#server/services/admin/users', () => ({ listAdminUsers: domainOperation }))
vi.mock('#server/services/vacancies/list-admin-vacancies', () => ({ listAdminVacancies: domainOperation }))
vi.mock('#server/services/vacancies/import-vacancies', () => ({ importVacancies: domainOperation, vacancyImportRequestSchema: {} }))
vi.mock('#server/services/vacancies/review-vacancy', () => ({ reviewVacancy: domainOperation, vacancyReviewSchema: {} }))
vi.mock('#server/services/vacancies/admin-vacancy', () => ({ getAdminVacancy: domainOperation }))
vi.mock('#server/services/admin/applications', () => ({ listAdminApplications: domainOperation, getAdminApplication: domainOperation, applicationQueueQuery: {} }))
vi.mock('#server/services/admin/application-handling', () => ({ handleApplication: domainOperation, prepareApplicationPackage: domainOperation }))

const sessionReader = vi.fn()
const admin = { id: 42, role: 'ADMIN', name: 'Admin', email: null, avatarUrl: null }
const handlers: EventHandler[] = []

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', eventHandler)
  vi.stubGlobal('getUserSession', sessionReader)
  vi.stubGlobal('createError', createError)
  handlers.push(
    (await import('../../server/api/v1/admin/dashboard.get')).default,
    (await import('../../server/api/v1/admin/users.get')).default,
    (await import('../../server/api/v1/admin/vacancies/index.get')).default,
    (await import('../../server/api/v1/admin/vacancies/import.post')).default,
    (await import('../../server/api/v1/admin/vacancies/[id].patch')).default,
    (await import('../../server/api/v1/admin/vacancies/[id].get')).default,
    (await import('../../server/api/v1/admin/vacancies/file.post')).default,
    (await import('../../server/api/v1/admin/applications/index.get')).default,
    (await import('../../server/api/v1/admin/applications/[id].get')).default,
    (await import('../../server/api/v1/admin/applications/[id]/handling.post')).default,
    (await import('../../server/api/v1/admin/applications/[id]/package.get')).default,
  )
})
beforeEach(() => vi.clearAllMocks())
afterAll(() => vi.unstubAllGlobals())

function request(handler: EventHandler) {
  const app = createApp()
  app.use('/test', handler)
  return toWebHandler(app)(new Request('http://localhost/test'))
}

describe('admin authorization independent of middleware/path matching', () => {
  it.each(['anonymous', 'user', 'revoked'])('all admin handlers reject %s before domain operations', async (scenario) => {
    sessionReader.mockResolvedValue(scenario === 'anonymous' ? {} : { user: { ...admin, role: scenario === 'user' ? 'USER' : 'ADMIN' } })
    currentAdmin.mockRejectedValue(createError({ statusCode: 403 }))
    for (const handler of handlers) expect((await request(handler)).status).toBe(403)
    expect(domainOperation).not.toHaveBeenCalled()
    expect(currentAdmin).toHaveBeenCalledTimes(scenario === 'revoked' ? handlers.length : 0)
  })

  it('caches DB authorization only within a request, never across requests', async () => {
    sessionReader.mockResolvedValue({ user: admin })
    currentAdmin.mockResolvedValue(admin)
    const handler = eventHandler(async (event) => {
      await requireAdminSession(event)
      await requireAdminSession(event)
      return 'authorized'
    })
    expect((await request(handler)).status).toBe(200)
    expect(currentAdmin).toHaveBeenCalledTimes(1)
    currentAdmin.mockRejectedValue(createError({ statusCode: 403 }))
    expect((await request(handler)).status).toBe(403)
    expect(currentAdmin).toHaveBeenCalledTimes(2)
  })
})
