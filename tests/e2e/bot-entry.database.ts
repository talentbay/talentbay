import { randomInt } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { testEntryBotID, testWebhookSecret } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const firstID = randomInt(1_000_000_000, 1_000_000_000_000)
const updateIDs = [firstID, firstID + 1]
const data = (update_id = firstID, text = '/applications') => ({ update_id, message: { message_id: 4, from: { id: 42, is_bot: false, first_name: 'Fictional private name' }, chat: { id: 42, type: 'private' }, text } })
const headers = { 'x-telegram-bot-api-secret-token': testWebhookSecret }
test.afterAll(async () => { await sql`delete from bot_entry_receipts where bot_id=${testEntryBotID} and update_id in ${sql(updateIDs)}`; await sql.end() })

test('compiled bot webhook authenticates before persistence and prepares one reply under HTTP retries/concurrency', async ({ request }) => {
  const before = await sql`select * from bot_entry_receipts where bot_id=${testEntryBotID}`
  expect((await request.post('/api/v1/bot/telegram', { data: data() })).status()).toBe(403)
  expect((await request.post('/api/v1/bot/telegram', { headers: { ...headers, 'content-type': 'text/plain' }, data: '{}' })).status()).toBe(415)
  expect((await request.post('/api/v1/bot/telegram', { headers, data: { update_id: -1 } })).status()).toBe(400)
  expect((await request.post('/api/v1/bot/telegram', { headers, data: { ...data(), padding: 'x'.repeat(65536) } })).status()).toBe(413)
  expect((await request.post('/api/v1/bot/telegram', { headers: { ...headers, 'content-type': 'application/json' }, data: Buffer.from([0xff]) })).status()).toBe(400)
  const group = data(); group.message.chat = { id: -42, type: 'group' }
  expect(await (await request.post('/api/v1/bot/telegram', { headers, data: group })).json()).toEqual({ ok: true })
  expect(await sql`select * from bot_entry_receipts where bot_id=${testEntryBotID}`).toEqual(before)
  const response = await request.post('/api/v1/bot/telegram', { headers, data: data() })
  expect(response.status()).toBe(200)
  expect(response.headers()['set-cookie']).toBeUndefined()
  expect(response.headers()['cache-control']).toBe('no-store')
  const reply = await response.json()
  expect(reply).toMatchObject({ method: 'sendMessage', chat_id: 42, reply_markup: { inline_keyboard: [[{ web_app: { url: 'https://talentbay.example/applications' } }]] } })
  expect(JSON.stringify(reply)).not.toContain('Fictional private name')
  expect(JSON.stringify(reply)).not.toContain(testWebhookSecret)
  expect(await (await request.post('/api/v1/bot/telegram', { headers, data: data() })).json()).toEqual({ ok: true })
  const reused = data(); reused.message.chat.id = 84; reused.message.from.id = 84
  expect(await (await request.post('/api/v1/bot/telegram', { headers, data: reused })).json()).toEqual({ ok: true })
  const bodies = await Promise.all(Array.from({ length: 5 }, async () => (await request.post('/api/v1/bot/telegram', { headers, data: data(firstID + 1, '/start') })).json()))
  expect(bodies.filter(body => body.method === 'sendMessage')).toHaveLength(1)
  const rows = await sql`select * from bot_entry_receipts where bot_id=${testEntryBotID} and update_id in ${sql(updateIDs)}`
  expect(rows).toHaveLength(2)
  expect(Object.keys(rows[0]!).sort()).toEqual(['bot_id', 'prepared_at', 'update_id'])
  expect((await request.get('/api/v1/auth/identities')).status()).toBe(401)
})
