import { z } from 'zod'
import { candidateApplicationProgress } from '#server/services/candidates/application-progress'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw createError({ statusCode: 400, statusMessage: 'Invalid application id' })
  const query = z.object({ before: z.coerce.number().int().positive().max(2147483647).optional() }).strict().safeParse(getQuery(event))
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid progress cursor' })
  return await candidateApplicationProgress(session.user.id, id, query.data.before)
})
