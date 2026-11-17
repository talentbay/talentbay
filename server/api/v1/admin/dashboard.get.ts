import { dashboardQuery, getAdminDashboard } from '#server/services/admin/dashboard'
import { requireAdminSession } from '#server/utils/admin-session'

export default defineEventHandler(async (event) => {
  const operator = await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const parsed = dashboardQuery.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid dashboard period' })
  return await getAdminDashboard(parsed.data, operator.id)
})
