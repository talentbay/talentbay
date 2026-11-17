import { z } from 'zod'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'
import { withdrawApplication } from '#server/services/candidates/applications'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw createError({ statusCode: 400, statusMessage: 'Invalid application id' })
  if (!z.object({}).strict().safeParse(await readBoundedJson(event, 512)).success) throw createError({ statusCode: 400, statusMessage: 'Invalid withdrawal request' })
  return await withdrawApplication(session.user.id, id)
})
