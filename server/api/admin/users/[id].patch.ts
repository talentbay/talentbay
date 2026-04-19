import { db } from '@nuxthub/db'
import {users} from '#server/db/schema/users'
import {eq} from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    return await db.update(users)
        .set(body)
        //@ts-ignore
        .where(eq(users.id, id))
        .returning();
})