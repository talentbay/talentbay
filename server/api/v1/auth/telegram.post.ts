import { z } from 'zod'
import { authenticateProviderUser } from '#server/services/auth/oauth-user'
import { validateTelegramInitData } from '#server/services/auth/telegram-init-data'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'

const inputSchema = z.object({
  initData: z.string().min(1).max(16_384),
  mode: z.enum(['login', 'link']).default('login'),
}).strict()

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const parsed = inputSchema.safeParse(await readBoundedJson(event, 32 * 1024))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid Telegram authentication request' })
  const body = parsed.data
  const config = useRuntimeConfig(event)
  if (!config.telegramBotToken) {
    throw createError({ statusCode: 503, statusMessage: 'Telegram sign-in is not configured yet' })
  }
  const identity = validateTelegramInitData(body.initData, config.telegramBotToken)
  const session = await getUserSession(event)
  if (body.mode === 'link' && !session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in before connecting Telegram' })
  }
  const user = await authenticateProviderUser(
    identity,
    body.mode === 'link' ? session.user?.id : undefined,
    body.mode === 'login' ? session.user?.id : undefined,
  )
  await replaceUserSession(event, { user })
  setHeader(event, 'cache-control', 'no-store')
  return { user }
})
