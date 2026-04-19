import { db } from '@nuxthub/db'

export default defineEventHandler(async (event) => {
    return await db.query.users.findMany({
        limit: 50
    })
})