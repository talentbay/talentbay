import { db, schema } from '#server/db'
import { eq } from 'drizzle-orm'
import type { NewUser, User } from '#shared/types/db'

export async function isRegistered(userData: NewUser): Promise<User> {
    const existing = await db.query.users.findFirst({
        where: eq(schema.users.providerID, userData.providerID),
    })

    if (existing) {
        return existing
    }

    const [created] = await db
        .insert(schema.users)
        .values(userData)
        .returning()

    if (!created) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to create user' })
    }

    return created
}
