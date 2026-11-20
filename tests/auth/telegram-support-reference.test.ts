import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ProductHostState } from '../../app/types/telegram'
import { telegramBotEntry } from '../../app/utils/telegram-bot-entry'

vi.mock('~/utils/telegram-launch', async () => import('../../app/utils/telegram-launch'))

const post = vi.fn()
const refresh = vi.fn()
const loggedIn = { value: true }
const generic = 'Telegram sign-in did not complete. Close this Mini App and open TalentBay again from the bot.'
const requestId = '12345678-abcd-4abc-9def-1234567890ab'
let state: ProductHostState

beforeEach(() => {
  vi.resetModules()
  post.mockReset().mockResolvedValue(undefined)
  refresh.mockReset().mockResolvedValue(undefined)
  loggedIn.value = true
  vi.stubGlobal('window', {
    Telegram: { WebApp: { initData: 'private-fixture', ready: vi.fn() } },
    location: { hash: '#tgWebAppData=current-launch-fixture' }, history: { replaceState: vi.fn() }, setTimeout,
  })
  vi.stubGlobal('document', {
    documentElement: { style: { setProperty: vi.fn() } },
    createElement: () => ({}), head: { append: (script: { onerror: () => void }) => script.onerror() },
  })
  vi.stubGlobal('useState', (key: string, init: () => ProductHostState | boolean) => {
    const value = init()
    if (key === 'product-host' && typeof value !== 'boolean') state = value
    return { value }
  })
  vi.stubGlobal('useRouter', () => ({ beforeEach: () => vi.fn() }))
  vi.stubGlobal('useUserSession', () => ({ fetch: refresh, loggedIn }))
  vi.stubGlobal('$fetch', post)
  vi.stubGlobal('onNuxtReady', (ready: () => void) => ready())
  vi.stubGlobal('defineNuxtPlugin', (setup: (app: unknown) => unknown) => setup({ vueApp: { onUnmount: vi.fn() } }))
})
afterEach(() => vi.unstubAllGlobals())

async function initialize() {
  await import('../../app/plugins/product-host.client')
  await vi.waitFor(() => expect(state.status).not.toBe('connecting'))
}

it('only adds a role to the configured bare bot link for a supported ID and material context', () => {
  const base = 'https://t.me/fixture_entry_bot'
  const capabilities = { telegram: true, google: false, github: false, telegramBotUrl: base, telegramVacancyEntry: true }
  const context = 'v1:' + 'a1'.repeat(32)
  const plain = { href: base, opensRole: false }
  for (const id of [1, 2_147_483_647]) {
    expect(telegramBotEntry(capabilities, id, context)).toEqual({ href: `${base}?start=job_${id}_${'a1'.repeat(12)}`, opensRole: true })
  }
  for (const id of [0, -1, 1.5, NaN, 2_147_483_648]) expect(telegramBotEntry(capabilities, id, context)).toEqual(plain)
  expect(telegramBotEntry(capabilities)).toEqual(plain)
  expect(telegramBotEntry(capabilities, 7, 'invalid')).toEqual(plain)
  expect(telegramBotEntry({ ...capabilities, telegramVacancyEntry: false }, 7, context)).toEqual(plain)
  expect(telegramBotEntry({ ...capabilities, google: true }, 7, context)).toBeNull()
  for (const url of [base + ' ', base + '\n', base + '?start=other', base + '#other', base + '/more', 'https://t.me@example.invalid/fixture_bot', 'https://example.invalid/fixture_bot']) {
    expect(telegramBotEntry({ ...capabilities, telegramBotUrl: url }, 7, context)).toBeNull()
  }
})

it.each(['TG-SDK', 'TG-LAUNCH'] as const)('identifies %s before any sign-in request', async (reference) => {
  window.location.hash = '#tgWebAppData='
  if (reference === 'TG-SDK') delete window.Telegram
  // Even a populated SDK cache cannot supply a different identity for an explicitly empty launch.
  await initialize()
  expect(state).toMatchObject({ status: 'error', message: generic, supportReference: reference })
  expect(post).not.toHaveBeenCalled()
})

it.each(['load-error', 'timeout'] as const)('validates the current carrier on SDK %s without enabling native controls', async (failure) => {
  delete window.Telegram
  if (failure === 'timeout') {
    document.head.append = vi.fn()
    Object.assign(window, { setTimeout: (callback: () => void) => setTimeout(callback, 0) })
  }
  await initialize()
  expect(post).toHaveBeenCalledExactlyOnceWith('/api/v1/auth/telegram', {
    method: 'POST', body: { initData: 'current-launch-fixture' }, timeout: 10_000,
  })
  expect(state).toMatchObject({ kind: 'web', status: 'ready', haptics: false })
  expect(refresh).toHaveBeenCalledOnce()
})

it.each([
  [401, 'TG-SIGNIN-401'], [503, 'TG-SIGNIN-503'], [undefined, 'TG-SIGNIN'],
  ['401 private-fixture', 'TG-SIGNIN'], [1000001, 'TG-SIGNIN'], [403.5, 'TG-SIGNIN'],
])('reports only a bounded reference for a rejected POST (%s)', async (status, reference) => {
  post.mockRejectedValue({ statusCode: status, message: 'private-fixture', data: { detail: 'private-fixture' } })
  await initialize()
  expect(state).toMatchObject({ status: 'error', message: generic, supportReference: reference })
  expect(post).toHaveBeenCalledOnce()
  expect(refresh).not.toHaveBeenCalled()
})

it('does not mistake a successful POST followed by a signed-out refresh for login', async () => {
  loggedIn.value = false
  await initialize()
  expect(post).toHaveBeenCalledOnce()
  expect(refresh).toHaveBeenCalledOnce()
  expect(state).toMatchObject({ status: 'error', message: generic, supportReference: 'TG-SESSION' })
})

it.each([requestId, 'untrusted header', requestId.toUpperCase(), requestId.replace('-4abc', '-7abc'), requestId.replace('-9def', '-1def'), null])('only exposes a canonical v4 request ID from the failed sign-in response (%s)', async header => {
  const response = new Response(null, { status: 401, headers: header === null ? {} : { 'x-request-id': header } })
  post.mockRejectedValue({ response, data: { requestId }, message: requestId })
  await initialize()
  expect(state.supportReference).toBe('TG-SIGNIN-401')
  expect(state.supportRequestId).toBe(header === requestId ? requestId : undefined)
})

it('does not show the session refresh request ID or classify it as a sign-in conflict', async () => {
  refresh.mockRejectedValue({ response: new Response(null, { status: 409, headers: { 'x-request-id': requestId } }) })
  await initialize()
  expect(state).toMatchObject({ status: 'error', supportReference: 'TG-SESSION', message: generic })
  expect(state.supportRequestId).toBeUndefined()
})

it('retains the separate conflict message without a reference', async () => {
  post.mockRejectedValue({ response: new Response(null, { status: 409, headers: { 'x-request-id': requestId } }) })
  await initialize()
  expect(state.status).toBe('conflict')
  expect(state.message).toContain('signed in to another account')
  expect(state.supportReference).toBeUndefined()
  expect(state.supportRequestId).toBeUndefined()
})

it('adds no support reference to a successful native login or an ordinary browser', async () => {
  await initialize()
  expect(state.status).toBe('ready')
  expect(state.supportReference).toBeUndefined()
  vi.resetModules()
  delete window.Telegram
  window.location.hash = ''
  await initialize()
  expect(post).toHaveBeenCalledOnce()
  expect(state).toMatchObject({ kind: 'web', status: 'ready', message: '' })
  expect(state.supportReference).toBeUndefined()
})
