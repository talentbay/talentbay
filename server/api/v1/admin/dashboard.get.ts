import { getAdminDashboard } from '#server/services/admin/dashboard'

export default defineEventHandler(async () => {
  return await getAdminDashboard()
})
