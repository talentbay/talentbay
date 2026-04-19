export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)
    const isProtectedRoute = event.path.startsWith('/api/admin')

    if (isProtectedRoute) {
        if (!session.user || session.user.role !== 'ADMIN') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden'
            })
        }
    }
})