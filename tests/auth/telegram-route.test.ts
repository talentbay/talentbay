import { createHmac } from 'node:crypto'
import { createApp, createError, eventHandler, readValidatedBody, setHeader, toWebHandler } from 'h3'
import type { EventHandler } from 'h3'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { replaceUserSession } from '../../node_modules/nuxt-auth-utils/dist/runtime/server/utils/session.js'

const { authenticate } = vi.hoisted(() => ({ authenticate: vi.fn() }))
vi.mock('#server/services/auth/oauth-user', () => ({ authenticateProviderUser: authenticate }))
const token = '123456789:telegram-route-test-only'
const sessionUser = { id: 123, role: 'USER', name: 'Candidate', email: null, avatarUrl: null }
const sessionReader = vi.fn()
const sessionReplacer = vi.fn(replaceUserSession)
let handler: EventHandler

function initData(age = 0) {
  const data = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1000) - age),
    user: JSON.stringify({ id: 1234567890, first_name: 'Candidate' }),
  })
  data.sort()
  const secret = createHmac('sha256', 'WebAppData').update(token).digest()
  data.set('hash', createHmac('sha256', secret).update([...data].map(([k, v]) => `${k}=${v}`).join('\n')).digest('hex'))
  return data.toString()
}

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', eventHandler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('readValidatedBody', readValidatedBody)
  vi.stubGlobal('getUserSession', sessionReader)
  vi.stubGlobal('replaceUserSession', sessionReplacer)
  vi.stubGlobal('setHeader', setHeader)
  vi.stubGlobal('useRuntimeConfig', () => ({ telegramBotToken: token }))
  handler = (await import('../../server/api/v1/auth/telegram.post')).default
})
beforeEach(() => {
  vi.clearAllMocks()
  sessionReader.mockResolvedValue({})
  authenticate.mockResolvedValue(sessionUser)
})
afterAll(() => vi.unstubAllGlobals())

async function request(body: unknown, origin = 'https://talentbay.test') {
  const app = createApp()
  app.use('/api/v1/auth/telegram', handler)
  return toWebHandler(app)(new Request('https://talentbay.test/api/v1/auth/telegram', {
    method: 'POST', headers: { 'content-type': 'application/json', origin, host: 'talentbay.test', 'x-forwarded-proto': 'https' }, body: JSON.stringify(body),
  }))
}

describe('Telegram authentication HTTP boundary', () => {
  it('verifies signed initData before persistence and writes a real sealed session', async () => {
    const response = await request({ initData: initData() })
    expect(response.status).toBe(200)
    expect(authenticate).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      provider: 'TELEGRAM', providerAccountID: '1234567890', email: null,
    }), undefined, undefined)
    expect(response.headers.getSetCookie().some(cookie => cookie.startsWith('nuxt-session=') && cookie.includes('HttpOnly'))).toBe(true)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it.each(['tampered', 'expired', 'duplicate', 'cross-origin'])('rejects %s input before persistence or session writes', async (scenario) => {
    let raw = initData(scenario === 'expired' ? 301 : 0)
    if (scenario === 'tampered') raw = raw.replace('Candidate', 'Attacker')
    if (scenario === 'duplicate') raw += '&user=%7B%7D'
    const response = await request({ initData: raw }, scenario === 'cross-origin' ? 'https://attacker.invalid' : undefined)
    expect(response.status).toBe(scenario === 'cross-origin' ? 403 : 401)
    expect(authenticate).not.toHaveBeenCalled()
    expect(sessionReplacer).not.toHaveBeenCalled()
  })

  it('requires an existing authenticated account for link mode', async () => {
    expect((await request({ initData: initData(), mode: 'link' })).status).toBe(401)
    expect(authenticate).not.toHaveBeenCalled()
    sessionReader.mockResolvedValue({ user: sessionUser })
    expect((await request({ initData: initData(), mode: 'link' })).status).toBe(200)
    expect(authenticate).toHaveBeenCalledWith(expect.anything(), sessionUser.id, undefined)
  })

  it('passes the current account constraint for login and preserves the session on conflicts', async () => {
    sessionReader.mockResolvedValue({ user: sessionUser })
    authenticate.mockRejectedValue(createError({ statusCode: 409, statusMessage: 'Identity belongs to another account' }))
    const response = await request({ initData: initData() })
    expect(response.status).toBe(409)
    expect(authenticate).toHaveBeenCalledWith(expect.anything(), undefined, sessionUser.id)
    expect(sessionReplacer).not.toHaveBeenCalled()
  })
})
