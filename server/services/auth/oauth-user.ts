import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import type { ConnectedIdentity, IdentityProvider, SessionUser } from '#shared/types/auth'

export type OAuthIdentity = {
  provider: 'GOOGLE' | 'GITHUB'
  providerAccountID: string
  email: string
  emailVerified: boolean
  name: string
  avatarUrl?: string | null
}

export type ProviderIdentity = {
  provider: IdentityProvider
  providerAccountID: string
  email: string | null
  name: string
  avatarUrl?: string | null
}

export function authenticateOAuthUser(identity: OAuthIdentity, linkToUserID?: number) {
  if (!identity.emailVerified || !z.email().safeParse(identity.email.trim()).success) {
    throw createError({ statusCode: 400, statusMessage: 'A verified email address is required' })
  }
  return authenticateProviderUser({ ...identity, email: identity.email.trim().toLowerCase() }, linkToUserID)
}

export async function authenticateProviderUser(
  identity: ProviderIdentity,
  linkToUserID?: number,
  currentUserID?: number,
): Promise<SessionUser> {
  const db = useDatabase()
  const user = await db.transaction(async (tx) => {
    // Serialize first login/link attempts for a provider subject, including missing rows.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${identity.provider}:${identity.providerAccountID}`}, 0))`)
    const [linked] = await tx.select({ user: schema.users })
      .from(schema.oauthAccounts)
      .innerJoin(schema.users, eq(schema.oauthAccounts.userID, schema.users.id))
      .where(and(
        eq(schema.oauthAccounts.provider, identity.provider),
        eq(schema.oauthAccounts.providerAccountID, identity.providerAccountID),
      )).limit(1)

    if (linked) {
      if ((linkToUserID !== undefined && linked.user.id !== linkToUserID)
        || (currentUserID !== undefined && linked.user.id !== currentUserID)) {
        throw createError({ statusCode: 409, statusMessage: 'This identity belongs to another account' })
      }
      const [updated] = await tx.update(schema.users).set({ lastLoginAt: new Date() })
        .where(eq(schema.users.id, linked.user.id)).returning()
      return updated!
    }

    if (currentUserID !== undefined && linkToUserID === undefined) {
      throw createError({ statusCode: 409, statusMessage: 'Connect this identity explicitly in Settings' })
    }

    let owner: typeof schema.users.$inferSelect | undefined
    if (linkToUserID !== undefined) {
      [owner] = await tx.select().from(schema.users)
        .where(eq(schema.users.id, linkToUserID)).for('update')
      if (!owner) throw createError({ statusCode: 401, statusMessage: 'Account no longer exists' })
    }

    if (identity.email) {
      const [emailOwner] = await tx.select({ id: schema.users.id }).from(schema.users)
        .where(eq(schema.users.email, identity.email)).limit(1)
      if (emailOwner && emailOwner.id !== owner?.id) {
        throw createError({ statusCode: 409, statusMessage: 'Sign in with your existing provider, then connect this identity in Settings' })
      }
    }

    if (!owner) {
      [owner] = await tx.insert(schema.users).values({
        email: identity.email, name: identity.name, avatarUrl: identity.avatarUrl ?? null,
        lastLoginAt: new Date(),
      }).onConflictDoNothing().returning()
      if (!owner) throw createError({ statusCode: 409, statusMessage: 'An account with this email already exists' })
    }

    await tx.insert(schema.oauthAccounts).values({
      userID: owner.id, provider: identity.provider,
      providerAccountID: identity.providerAccountID, providerEmail: identity.email,
    })
    const [updated] = await tx.update(schema.users).set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, owner.id)).returning()
    return updated!
  })
  return toSessionUser(user)
}

export async function listConnectedIdentities(userID: number): Promise<ConnectedIdentity[]> {
  const rows = await useDatabase().select({
    provider: schema.oauthAccounts.provider, email: schema.oauthAccounts.providerEmail,
    createdAt: schema.oauthAccounts.createdAt,
  }).from(schema.oauthAccounts).where(eq(schema.oauthAccounts.userID, userID))
  return rows.map(row => ({ provider: row.provider, email: row.email, connectedAt: row.createdAt.toISOString() }))
}

export function toSessionUser(user: typeof schema.users.$inferSelect): SessionUser {
  return { id: user.id, role: user.role, name: user.name, email: user.email, avatarUrl: user.avatarUrl }
}
