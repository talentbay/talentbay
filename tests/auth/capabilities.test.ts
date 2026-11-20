import { createApp, toWebHandler } from 'h3'
import { afterEach, expect, it, vi } from 'vitest'
import capabilities from '../../server/api/v1/auth/capabilities.get'

const { configured } = vi.hoisted(() => ({ configured: vi.fn(() => true) }))
vi.mock('#server/db', () => ({ isDatabaseConfigured: configured }))
afterEach(() => { vi.unstubAllGlobals(); configured.mockReset() })

const runtime = {
  telegramBotID: '123456', telegramBotUsername: 'Fixture_Bot', telegramBotToken: '123456:fake-fixture-token',
  telegramWebhookSecret: 'private-fixture-value',
}
const telegramOnly = { google: false, github: false, telegram: true }
const entryRuntime = { ...runtime, telegramWebhookSecret: 'synthetic_webhook_fixture_for_entry_only', telegramAppOrigin: 'https://talentbay.example' }

async function get(config: Record<string, unknown>) {
  vi.stubGlobal('useRuntimeConfig', () => config)
  const app = createApp()
  app.use('/api/v1/auth/capabilities', capabilities)
  const response = await toWebHandler(app)(new Request('https://example.test/api/v1/auth/capabilities'))
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  return response.json()
}

it.each(['Fixture_Bot', ' @Fixture_Bot '])('returns only flags and the public link for %s', async (username) => {
  expect(await get({ ...runtime, telegramBotUsername: username })).toEqual({
    ...telegramOnly, telegramBotUrl: 'https://t.me/Fixture_Bot',
  })
})

it('advertises vacancy entry only for the configured guest bot and a consistent entry configuration', async () => {
  const guest = { ...telegramOnly, telegramBotUrl: 'https://t.me/Fixture_Bot' }
  expect(await get(entryRuntime)).toEqual({ ...guest, telegramVacancyEntry: true })
  for (const change of [
    { telegramBotID: '' }, { telegramBotID: '654321' }, { telegramBotToken: 'opaque-fixture' },
    { telegramBotToken: '123456:' }, { telegramWebhookSecret: 'short' }, { telegramAppOrigin: 'http://talentbay.example' },
    { telegramBotUsername: '@Fixture_Bot' },
  ]) expect(await get({ ...entryRuntime, ...change })).toEqual(guest)
  expect(await get({ ...entryRuntime, telegramBotUsername: 'no_bot_suffix' })).toEqual(telegramOnly)
  expect(await get({ ...entryRuntime, oauth: { google: { clientId: 'id', clientSecret: 'fixture' } } })).toEqual({ ...telegramOnly, google: true })
  configured.mockReturnValueOnce(false)
  expect(await get(entryRuntime)).toEqual({ ...telegramOnly, telegram: false })
})

it.each([
  undefined, '', 123456, '123456', runtime.telegramBotToken, 'not_a_bot_handle',
  'https://example.test/Fixture_Bot', 'fixture/bot', 'fixture?x=bot', '@@fixture_bot',
  'a'.repeat(30) + 'bot',
])('omits the link for invalid username %s without disabling native sign-in', async (username) => {
  expect(await get({ ...runtime, telegramBotUsername: username })).toEqual(telegramOnly)
})

it('preserves the flags-only response for previews and browser sign-in providers', async () => {
  const preview = { ...telegramOnly, telegram: false }
  expect(await get({ ...runtime, telegramBotToken: '' })).toEqual(preview)
  configured.mockReturnValueOnce(false)
  expect(await get(runtime)).toEqual(preview)
  for (const provider of ['google', 'github']) {
    expect(await get({ ...runtime, oauth: { [provider]: { clientId: 'id', clientSecret: 'secret' } } }))
      .toEqual({ ...telegramOnly, [provider]: true })
  }
})
