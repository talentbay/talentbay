import { db } from '@nuxthub/db'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    console.log(id)
    return await db.query.users.findFirst({
        // @ts-ignore
        where: (users,
                // @ts-ignore
                { eq }) => eq(users.id, id),
    })
})