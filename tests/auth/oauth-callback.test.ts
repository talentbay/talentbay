import { createApp, createError, send, toWebHandler } from 'h3'
import type { EventHandler } from 'h3'
import type { SessionUser } from '../../shared/types/auth'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineOAuthGoogleEventHandler } from '../../node_modules/nuxt-auth-utils/dist/runtime/server/lib/oauth/google.js'
import { defineOAuthGitHubEventHandler } from '../../node_modules/nuxt-auth-utils/dist/runtime/server/lib/oauth/github.js'
import { setUserSession } from '../../node_modules/nuxt-auth-utils/dist/runtime/server/utils/session.js'

const { authenticate, logError } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  logError: vi.fn(),
}))

vi.mock('#server/services/auth/oauth-user', () => ({ authenticateOAuthUser: authenticate }))
vi.mock('#server/utils/observability', () => ({ logHandledRequestError: logError }))

const sessionWriter = vi.fn(setUserSession)
const sessionUser: SessionUser = {
  id: 123, role: 'USER', name: 'Test Candidate',
  email: 'candidate@example.test', avatarUrl: null,
}

// Only the provider transport and persistence boundary are mocked, never state validation.
const providerFetch = vi.fn(async (url: string) => {
  if (url === 'https://oauth.invalid/google/token' || url === 'https://oauth.invalid/github/token') {
    return { access_token: 'test-only-token' }
  }
  if (url === 'https://oauth.invalid/google/user') {
    return { sub: 'google-123', email: sessionUser.email, email_verified: true, name: sessionUser.name }
  }
  if (url === 'https://oauth.invalid/github/user') {
    return { id: 123, login: 'candidate', email: null, name: sessionUser.name }
  }
  if (url === 'https://oauth.invalid/github/user/emails' || url === 'https://api.github.com/user/emails') {
    return [{ email: sessionUser.email, primary: true, verified: true }]
  }
  throw new Error('Unexpected OAuth network request')
})

class BrowserCookies {
  private values = new Map<string, string>()

  read() {
    return [...this.values].map(([name, value]) => `${name}=${value}`).join('; ')
  }

  update(response: Response) {
    for (const header of response.headers.getSetCookie()) {
      const [pair = ''] = header.split(';')
      const separator = pair.indexOf('=')
      const name = pair.slice(0, separator)
      if (/max-age=0/i.test(header)) {
        this.values.delete(name)
      }
      else {
        this.values.set(name, pair.slice(separator + 1))
      }
    }
  }
}

let google: EventHandler
let github: EventHandler

beforeAll(async () => {
  vi.stubGlobal('defineOAuthGoogleEventHandler', defineOAuthGoogleEventHandler)
  vi.stubGlobal('defineOAuthGitHubEventHandler', defineOAuthGitHubEventHandler)
  vi.stubGlobal('setUserSession', sessionWriter)
  vi.stubGlobal('send', send)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('$fetch', providerFetch)
  google = (await import('../../server/api/v1/auth/google.get')).default
  github = (await import('../../server/api/v1/auth/github.get')).default
})

beforeEach(() => {
  vi.clearAllMocks()
  authenticate.mockResolvedValue(sessionUser)
})

afterAll(() => vi.unstubAllGlobals())

describe.each(['google', 'github'] as const)('%s OAuth callback (installed runtime + real route)', (provider) => {
  function request(query = '', cookie = '') {
    const app = createApp()
    app.use(`/api/v1/auth/${provider}`, provider === 'google' ? google : github)
    return toWebHandler(app)(new Request(`https://talentbay.test/api/v1/auth/${provider}${query}`, {
      headers: cookie ? { cookie } : {},
    }))
  }

  async function start() {
    const browser = new BrowserCookies()
    const response = await request()
    expect(response.status).toBe(302)
    const state = new URL(response.headers.get('location')!).searchParams.get('state')!
    expect(state).toMatch(/^[A-Za-z0-9_-]{40,}$/)
    const stateCookie = response.headers.getSetCookie().find(cookie => cookie.startsWith('nuxt-auth-state='))!
    expect(stateCookie).toContain('HttpOnly')
    expect(stateCookie).toContain('SameSite=Lax')
    expect(stateCookie).toContain('Secure')
    browser.update(response)
    return { browser, state }
  }

  function expectNoAuthentication(response: Response) {
    expect(authenticate).not.toHaveBeenCalled()
    expect(sessionWriter).not.toHaveBeenCalled()
    expect(providerFetch).not.toHaveBeenCalled()
    expect(response.headers.getSetCookie().some(cookie => cookie.startsWith('nuxt-session='))).toBe(false)
  }

  it('accepts matching state, reaches verified-provider persistence and writes one real session', async () => {
    const { browser, state } = await start()
    const response = await request(`?code=test-code&state=${state}`, browser.read())
    expect(response.status).toBe(200)
    expect(authenticate).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      provider: provider.toUpperCase(), providerAccountID: provider === 'google' ? 'google-123' : '123',
      email: sessionUser.email, emailVerified: true,
    }))
    expect(sessionWriter).toHaveBeenCalledTimes(1)
    expect(logError).not.toHaveBeenCalled()
    expect(response.headers.getSetCookie().some(cookie => cookie.startsWith('nuxt-session=') && cookie.includes('HttpOnly'))).toBe(true)
    expect(response.headers.getSetCookie().some(cookie => cookie.startsWith('nuxt-auth-state=') && /max-age=0/i.test(cookie))).toBe(true)
  })

  it.each(['wrong state', 'missing state', 'missing cookie', 'both missing', 'empty state', 'empty cookie', 'array state'])('rejects %s before persistence or session creation', async (scenario) => {
    const { browser, state } = await start()
    let query = `?code=test-code&state=${state}`
    let cookie = browser.read()
    if (scenario === 'wrong state') query = '?code=test-code&state=attacker-state'
    if (scenario === 'missing state' || scenario === 'both missing') query = '?code=test-code'
    if (scenario === 'missing cookie' || scenario === 'both missing') cookie = ''
    if (scenario === 'empty state') query = '?code=test-code&state='
    if (scenario === 'empty cookie') cookie = 'nuxt-auth-state='
    if (scenario === 'array state') query += '&state=attacker-state'
    const response = await request(query, cookie)
    // Existing onError closes the popup with HTTP 200; that is not auth success.
    expect(response.status).toBe(scenario === 'wrong state' ? 200 : 400)
    if (scenario === 'wrong state') {
      expect(logError).toHaveBeenCalledTimes(1)
      expect(logError).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        message: expect.stringContaining('state mismatch'),
      }), `oauth.${provider}`)
    }
    expectNoAuthentication(response)
    expect(response.headers.getSetCookie().some(header => header.startsWith('nuxt-auth-state=') && /max-age=0/i.test(header))).toBe(true)
  })

  it('rejects replay after the browser consumes the cleared state cookie without replacing its session', async () => {
    const { browser, state } = await start()
    const query = `?code=test-code&state=${state}`
    browser.update(await request(query, browser.read()))
    expect(browser.read()).not.toContain('nuxt-auth-state=')
    expect(browser.read()).toContain('nuxt-session=')
    const existingSession = browser.read()
    vi.clearAllMocks()
    const response = await request(query, browser.read())
    expect(response.status).toBe(400)
    browser.update(response)
    expectNoAuthentication(response)
    expect(browser.read()).toBe(existingSession)
  })
})
