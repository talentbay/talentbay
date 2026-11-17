import type { H3Event } from 'h3'
import type { SessionUser } from '#shared/types/auth'
import { requireCurrentAdmin } from '#server/services/auth/authorization'

declare module 'h3' {
  interface H3EventContext {
    talentbayAdminUser?: SessionUser
  }
}

export async function requireAdminSession(event: H3Event): Promise<SessionUser> {
  if (event.context.talentbayAdminUser) return event.context.talentbayAdminUser
  const session = await getUserSession(event)
  if (!session.user || session.user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  const user = await requireCurrentAdmin(session.user.id)
  event.context.talentbayAdminUser = user
  return user
}
