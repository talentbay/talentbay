import { requireAdminSession } from '#server/utils/admin-session'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'
import { applicationCommandSchema } from '#shared/schemas/application-command'
import { handleApplication } from '#server/services/admin/application-handling'

export default defineEventHandler(async (event) => {
  const session = await requireAdminSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw createError({ statusCode: 400, statusMessage: 'Invalid application id' })
  const result = applicationCommandSchema.safeParse(await readBoundedJson(event, 12_000))
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Invalid handling action' })
  return await handleApplication(session.id, id, result.data)
})
