import { webcrypto } from 'node:crypto'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { validateTelegramInitData } from '#server/services/auth/telegram-init-data'

const token = '123456789:test-only-bot-token'
const now = 1_792_966_000_000
const user = { id: 4_000_000_001, first_name: 'Test', last_name: 'Candidate' }
vi.stubGlobal('createError', (input: object) => Object.assign(new Error('Invalid authentication'), input))
afterAll(() => vi.unstubAllGlobals())

// Independent signer uses Web Crypto, while production uses Node's HMAC API.
async function signed(fields: Record<string, string> = {}) {
  const params = new URLSearchParams({ auth_date: String(now / 1000), user: JSON.stringify(user), ...fields })
  params.sort()
  const encoder = new TextEncoder()
  const hmac = async (key: Uint8Array, value: string) => {
    const secret = await webcrypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return new Uint8Array(await webcrypto.subtle.sign('HMAC', secret, encoder.encode(value)))
  }
  const key = await hmac(encoder.encode('WebAppData'), token)
  const hash = await hmac(key, [...params].map(([k, v]) => `${k}=${v}`).join('\n'))
  params.set('hash', Buffer.from(hash).toString('hex'))
  return params.toString()
}

describe('Telegram initData verification', () => {
  it('accepts correctly signed data with a 52-bit-safe stable user ID and no invented email', async () => {
    expect(validateTelegramInitData(await signed(), token, now)).toEqual({
      provider: 'TELEGRAM', providerAccountID: '4000000001', email: null,
      name: 'Test Candidate', avatarUrl: null,
    })
  })

  it('rejects altered user data and a different bot token', async () => {
    const raw = await signed()
    const changed = new URLSearchParams(raw)
    changed.set('user', JSON.stringify({ ...user, id: 42 }))
    expect(() => validateTelegramInitData(changed.toString(), token, now)).toThrow()
    expect(() => validateTelegramInitData(raw, 'other-bot-token', now)).toThrow()
  })

  it.each([-301, 31])('rejects auth_date offset %i seconds', async (offset) => {
    const raw = await signed({ auth_date: String(now / 1000 + offset) })
    expect(() => validateTelegramInitData(raw, token, now)).toThrow()
  })

  it.each(['', 'abc', '1792966000abc', '-1', '1.5'])('rejects noncanonical auth_date %s', async (auth_date) => {
    const raw = await signed({ auth_date })
    expect(() => validateTelegramInitData(raw, token, now)).toThrow()
  })

  it('rejects duplicate fields, missing or malformed signatures and excessive payloads', async () => {
    const raw = await signed()
    for (const invalid of [raw + '&user=%7B%7D', raw + '&hash=abc', raw.replace(/hash=[^&]+/, 'hash=abc'), raw.replace(/hash=[^&]+/, ''), 'x'.repeat(16_385)]) {
      expect(() => validateTelegramInitData(invalid, token, now)).toThrow()
    }
  })

  it.each(['{}', '{', '{"id":"42","first_name":"Test"}', '{"id":-1,"first_name":"Test"}'])('rejects signed malformed user %s', async (value) => {
    const raw = await signed({ user: value })
    expect(() => validateTelegramInitData(raw, token, now)).toThrow()
  })
})
