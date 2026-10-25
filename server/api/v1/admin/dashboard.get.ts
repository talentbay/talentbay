import { getAdminDashboard } from '#server/services/admin/dashboard'
import { requireAdminSession } from '#server/utils/admin-session'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  return await getAdminDashboard()
})
