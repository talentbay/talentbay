import { z } from 'zod'
import { requireSameOrigin } from '#server/utils/same-origin'

const inputSchema = z.object({ provider: z.enum(['GOOGLE', 'GITHUB']) })

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const session = await requireUserSession(event)
  const { provider } = await readValidatedBody(event, value => inputSchema.parse(value))
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
