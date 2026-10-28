import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { ProviderIdentity } from './oauth-user'
import type { TelegramAuthRejectionReason } from '#shared/types/auth'

const telegramUserSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  first_name: z.string().min(1).max(256),
  last_name: z.string().max(256).optional(),
  photo_url: z.url({ protocol: /^https$/ }).optional(),
})

/** Telegram's documented HMAC algorithm, using Node's standard crypto primitives. */
export function validateTelegramInitData(raw: string, botToken: string, now = Date.now()): ProviderIdentity {
  const invalid = (reason: TelegramAuthRejectionReason) => createError({ statusCode: 401, statusMessage: 'Telegram authentication is invalid or expired. Reopen the app.', data: { telegramAuthFailure: reason } })
  if (!raw || raw.length > 16_384 || !botToken) throw invalid('payload')
  const params = new URLSearchParams(raw)
  const keys = [...params.keys()]
  if (new Set(keys).size !== keys.length) throw invalid('duplicate')
  const hash = params.get('hash') ?? ''
  const date = params.get('auth_date') ?? ''
  if (!/^[a-f0-9]{64}$/i.test(hash) || !/^\d{1,12}$/.test(date)) throw invalid('format')
  const age = now / 1000 - Number(date)
  if (age > 300) throw invalid('expired')
  if (age < -30) throw invalid('future')

  params.delete('hash')
  params.sort()
  const data = [...params].map(([key, value]) => `${key}=${value}`).join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expected = createHmac('sha256', secret).update(data).digest()
  if (!timingSafeEqual(expected, Buffer.from(hash, 'hex'))) throw invalid('hmac')

  let parsed: unknown
  try { parsed = JSON.parse(params.get('user') ?? '') }
  catch { throw invalid('user_json') }
  const result = telegramUserSchema.safeParse(parsed)
  if (!result.success) throw invalid('user_schema')
  const user = result.data
  return {
    provider: 'TELEGRAM', providerAccountID: String(user.id), email: null,
    name: [user.first_name, user.last_name].filter(Boolean).join(' '),
    avatarUrl: user.photo_url ?? null,
  }
}
