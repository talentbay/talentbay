export default defineEventHandler(async (event) => {
  const isProtectedRoute = event.path.startsWith('/api/v1/admin')

  if (!isProtectedRoute) {
    return
  }

  const session = await getUserSession(event)
  if (!session.user || session.user.role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
  }
})
