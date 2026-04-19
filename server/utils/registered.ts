import { db, schema } from '@nuxthub/db'

// @ts-ignore
export async function isRegistered(userData) {
    const user = await db.query.users.findFirst({
        // @ts-ignore
        where: (users,
                { eq }) => eq(users.providerID, userData.providerID),
    })
    if (user) {
        return user
    } else {
        const result = await db
            .insert(schema.users)
            .values({
                ...userData
            })
            .returning()
        return user
    }
}