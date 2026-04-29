import { db, schema } from '@nuxthub/db'
import { users } from '#server/db/schema/users'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    // @ts-ignore
    const user = await db.query.users.findFirst({
        where: (users,
                { eq }) => eq(users.providerID, body.providerID),
    })
    if (!user) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden'
        })
    } else {
        // @ts-ignore
        const isValid = await verifyPassword(user.password, body.password)
        if (!isValid) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized'
            })
        } else {
            await setUserSession(event, {user: user})
            return user
        }
    }
})