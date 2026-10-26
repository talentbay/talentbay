import { requireAdminSession } from '#server/utils/admin-session'
import { getAdminApplication } from '#server/services/admin/applications'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw createError({ statusCode: 400, statusMessage: 'Invalid application id' })
  return await getAdminApplication(id)
})
