import { requireAdminSession } from '#server/utils/admin-session'

export default defineEventHandler(async (event) => {
  const path = event.path.toLowerCase()
  const isProtectedRoute = path === '/api/v1/admin' || path.startsWith('/api/v1/admin/')

  if (!isProtectedRoute) {
    return
  }

  await requireAdminSession(event)
})
