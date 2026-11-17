import { createApp, toWebHandler } from 'h3'
import type { EventHandler } from 'h3'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { claim, configured } = vi.hoisted(() => ({ claim: vi.fn(), configured: vi.fn() }))
vi.mock('#server/services/bot/receipt', () => ({ claimBotEntry: claim }))
vi.mock('#server/db', () => ({ isDatabaseConfigured: configured }))
const secret = 'fictional_webhook_secret_at_least_32_chars'
const validRuntime = { telegramBotID: '12345', telegramBotUsername: 'talentbay_test_bot', telegramBotToken: 'fictional-bot-token', telegramWebhookSecret: secret, telegramAppOrigin: 'https://talentbay.example' }
let runtime: Record<string, string> = validRuntime
let handler: EventHandler
beforeAll(async () => {
  vi.stubGlobal('useRuntimeConfig', () => runtime)
  handler = (await import('../../server/api/v1/bot/telegram.post')).default
})
beforeEach(() => { vi.clearAllMocks(); runtime = validRuntime; configured.mockReturnValue(true); claim.mockResolvedValue(true) })
afterAll(() => vi.unstubAllGlobals())
const update = { update_id: 123, message: { message_id: 4, from: { id: 42, is_bot: false }, chat: { id: 42, type: 'private' }, text: '/applications' } }
async function request(body: unknown = update, headers: Record<string, string> = {}) {
  const app = createApp()
  app.use('/api/v1/bot/telegram', handler)
  return toWebHandler(app)(new Request('https://talentbay.example/api/v1/bot/telegram', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-telegram-bot-api-secret-token': secret, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
  }))
}

describe('real webhook HTTP boundary with fake persistence, no provider sends', () => {
  it('is default-off and authenticates before JSON/DB work', async () => {
    runtime = {}
    expect((await request()).status).toBe(503)
    runtime = validRuntime
    for (const value of ['', 'wrong']) expect((await request('not JSON', { 'x-telegram-bot-api-secret-token': value })).status).toBe(403)
    expect(configured).not.toHaveBeenCalled()
    expect(claim).not.toHaveBeenCalled()
  })
  it('requires uncompressed bounded UTF8 JSON and safe update shape', async () => {
    expect((await request({}, { 'content-type': 'text/plain' })).status).toBe(415)
    expect((await request({}, { 'content-encoding': 'gzip' })).status).toBe(415)
    expect((await request('bad JSON')).status).toBe(400)
    expect((await request({ update_id: -1 })).status).toBe(400)
    expect((await request({ ...update, padding: 'x'.repeat(65536) })).status).toBe(413)
    expect(claim).not.toHaveBeenCalled()
  })
  it('returns only a static method reply after durable claim; a replay gets no second reply or session', async () => {
    const response = await request()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.getSetCookie()).toEqual([])
    expect(await response.json()).toMatchObject({ method: 'sendMessage', chat_id: 42, reply_markup: { inline_keyboard: [[{ web_app: { url: 'https://talentbay.example/applications' } }]] } })
    expect(claim).toHaveBeenCalledExactlyOnceWith('12345', 123)
    claim.mockResolvedValue(false)
    expect(await (await request()).json()).toEqual({ ok: true })
  })
  it('ignores unsupported updates without persistence and fails closed on unavailable DB without leaking errors', async () => {
    expect(await (await request({ update_id: 5, channel_post: { text: 'Private unknown source data' } })).json()).toEqual({ ok: true })
    expect(claim).not.toHaveBeenCalled()
    configured.mockReturnValue(false)
    expect((await request()).status).toBe(503)
    configured.mockReturnValue(true)
    claim.mockRejectedValue(new Error('postgresql://private-provider-secret'))
    const response = await request()
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private-provider-secret')
  })
})
