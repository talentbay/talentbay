import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ProductHostState } from '../../app/types/telegram'

vi.mock('~/utils/telegram-launch', async () => import('../../app/utils/telegram-launch'))

const post = vi.fn()
const refresh = vi.fn()
const loggedIn = { value: true }
const generic = 'Telegram sign-in is unavailable. You can still browse jobs or use another sign-in method.'
let state: ProductHostState

beforeEach(() => {
  vi.resetModules()
  post.mockReset().mockResolvedValue(undefined)
  refresh.mockReset().mockResolvedValue(undefined)
  loggedIn.value = true
  vi.stubGlobal('window', {
    Telegram: { WebApp: { initData: 'private-fixture', ready: vi.fn() } },
    location: { hash: '#tgWebAppData=' }, history: { replaceState: vi.fn() }, setTimeout,
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

it.each(['TG-SDK', 'TG-LAUNCH'] as const)('identifies %s before any sign-in request', async (reference) => {
  if (reference === 'TG-SDK') delete window.Telegram
  else window.Telegram!.WebApp!.initData = ''
  await initialize()
  expect(state).toMatchObject({ status: 'error', message: generic, supportReference: reference })
  expect(post).not.toHaveBeenCalled()
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

it('retains the separate conflict message without a reference', async () => {
  post.mockRejectedValue({ status: 409 })
  await initialize()
  expect(state.status).toBe('conflict')
  expect(state.message).toContain('signed in to another account')
  expect(state.supportReference).toBeUndefined()
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
