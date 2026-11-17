import { eq } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import { toSessionUser } from './oauth-user'

export async function requireCurrentAdmin(userID: number) {
  const [user] = await useDatabase().select().from(schema.users)
    .where(eq(schema.users.id, userID)).limit(1)
  if (!user || user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return toSessionUser(user)
}
