import { z } from 'zod'
import { authenticateProviderUser } from '#server/services/auth/oauth-user'
import { validateTelegramInitData } from '#server/services/auth/telegram-init-data'
import { requireSameOrigin } from '#server/utils/same-origin'

const inputSchema = z.object({
  initData: z.string().min(1).max(16_384),
  mode: z.enum(['login', 'link']).default('login'),
})

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const body = await readValidatedBody(event, value => inputSchema.parse(value))
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
