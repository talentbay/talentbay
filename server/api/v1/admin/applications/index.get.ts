import { requireAdminSession } from '#server/utils/admin-session'
import { applicationQueueQuery, listAdminApplications } from '#server/services/admin/applications'

export default defineEventHandler(async (event) => {
  const operator = await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const query = applicationQueueQuery.safeParse(getQuery(event))
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid application filters' })
  return await listAdminApplications(query.data, operator.id)
})
