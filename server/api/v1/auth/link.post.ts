import { z } from 'zod'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'

const inputSchema = z.object({ provider: z.enum(['GOOGLE', 'GITHUB']) }).strict()

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const session = await requireUserSession(event)
  const parsed = inputSchema.safeParse(await readBoundedJson(event, 2048))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid linking request' })
  const { provider } = parsed.data
  const key = provider === 'GOOGLE' ? 'google' : 'github'
  const config = useRuntimeConfig(event).oauth?.[key]
  if (!config?.clientId || !config.clientSecret) {
    throw createError({ statusCode: 503, statusMessage: 'This sign-in provider is not configured yet' })
  }
  await replaceUserSession(event, {
    ...session,
    secure: { ...session.secure, oauthLink: { provider, userID: session.user.id, expiresAt: Date.now() + 300_000 } },
  })
  return { url: `/api/v1/auth/${provider.toLowerCase()}` }
})
