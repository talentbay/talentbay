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

  it('preserves modern signed fields, escaped avatar URLs and Unicode until verification', async () => {
    const modern = { ...user, first_name: '\u0410\u043b\u0435\u043a\u0441 + & %', last_name: '', username: 'fixture_user', is_premium: true, allows_write_to_pm: false, photo_url: 'https://t.me/i/userpic/320/fixture.svg' }
    const raw = await signed({ user: JSON.stringify(modern).replaceAll('/', '\\/'), signature: 'synthetic_ed25519_signature-field_-', chat_instance: 'fixture-instance', chat_type: 'sender' })
    expect(validateTelegramInitData(raw, token, now)).toMatchObject({ providerAccountID: String(user.id), name: modern.first_name, avatarUrl: modern.photo_url })
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

  it('classifies rejection stages without attaching launch data or user values', async () => {
    const valid = await signed()
    const badHash = new URLSearchParams(valid)
    badHash.set('hash', '0'.repeat(64))
    const cases = [
      ['', 'payload'],
      [valid + '&user=%7B%7D', 'duplicate'],
      [await signed({ auth_date: 'not-a-date' }), 'format'],
      [await signed({ auth_date: String(now / 1000 - 301) }), 'expired'],
      [await signed({ auth_date: String(now / 1000 + 31) }), 'future'],
      [badHash.toString(), 'hmac'],
      [await signed({ user: '{' }), 'user_json'],
      [await signed({ user: '{}' }), 'user_schema'],
    ]
    for (const [raw, reason] of cases) {
      let failure: unknown
      try { validateTelegramInitData(raw!, token, now) } catch (error) { failure = error }
      expect(failure).toMatchObject({ statusCode: 401, data: { telegramAuthFailure: reason } })
      expect(JSON.stringify((failure as { data: unknown }).data)).not.toContain('auth_date')
      expect(JSON.stringify((failure as { data: unknown }).data)).not.toContain('Candidate')
      expect(JSON.stringify((failure as { data: unknown }).data)).not.toContain(token)
    }
  })
})
