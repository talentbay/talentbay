export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)
    const isProtectedRoute = event.path.startsWith('/api/v1/admin')

    if (isProtectedRoute) {
        // @ts-ignore
        if (!session.user || session.user.role !== 'ADMIN') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden'
            })
        }
    }
})