import { and, eq } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import type { Database } from '#server/db'
import type { SessionUser } from '#shared/types/auth'

type OAuthProvider = typeof schema.oauthAccounts.$inferInsert.provider

export type OAuthIdentity = {
  provider: OAuthProvider
  providerAccountID: string
  email: string
  emailVerified: boolean
  name: string
  avatarUrl?: string | null
}

export async function authenticateOAuthUser(identity: OAuthIdentity): Promise<SessionUser> {
  const email = identity.email.trim().toLowerCase()

  if (!email || !identity.emailVerified) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A verified email address is required',
    })
  }

  const db = useDatabase()
  const user = await db.transaction(async (tx) => {
    const [linkedAccount] = await tx
      .select({ user: schema.users })
      .from(schema.oauthAccounts)
      .innerJoin(schema.users, eq(schema.oauthAccounts.userID, schema.users.id))
      .where(and(
        eq(schema.oauthAccounts.provider, identity.provider),
        eq(schema.oauthAccounts.providerAccountID, identity.providerAccountID),
      ))
      .limit(1)

    if (linkedAccount) {
      const [updatedUser] = await tx
        .update(schema.users)
        .set({ lastLoginAt: new Date() })
        .where(eq(schema.users.id, linkedAccount.user.id))
        .returning()

      return updatedUser ?? linkedAccount.user
    }

    const [existingUser] = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)

    const accountOwner = existingUser ?? await createUser(tx, {
      email,
      name: identity.name,
      avatarUrl: identity.avatarUrl ?? null,
    })

    await tx.insert(schema.oauthAccounts).values({
      userID: accountOwner.id,
      provider: identity.provider,
      providerAccountID: identity.providerAccountID,
      providerEmail: email,
    })

    if (existingUser) {
      await tx
        .update(schema.users)
        .set({ lastLoginAt: new Date() })
        .where(eq(schema.users.id, existingUser.id))
    }

    return accountOwner
  })

  return toSessionUser(user)
}

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

async function createUser(
  tx: Transaction,
  values: Pick<typeof schema.users.$inferInsert, 'email' | 'name' | 'avatarUrl'>,
) {
  const [createdUser] = await tx
    .insert(schema.users)
    .values({
      ...values,
      lastLoginAt: new Date(),
    })
    .returning()

  if (!createdUser) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user',
    })
  }

  return createdUser
}

function toSessionUser(user: typeof schema.users.$inferSelect): SessionUser {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}
