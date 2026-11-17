import { and, count, desc, eq, ilike, lt, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { adminUsersQuery, containsText, readAdminCursor, writeAdminCursor } from './list-page'

export type AdminUserFilters = z.input<typeof adminUsersQuery>

export async function listAdminUsers(input: AdminUserFilters) {
  const parsed = adminUsersQuery.safeParse(input)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid user list query' })
  const filters = parsed.data
  const cursor = readAdminCursor('users', filters)
  const db = useDatabase()
  const conditions: (SQL | undefined)[] = []

  if (filters.role) {
    conditions.push(eq(schema.users.role, filters.role))
  }

  if (filters.q) {
    const search = containsText(filters.q)
    conditions.push(or(
      ilike(schema.users.name, search),
      ilike(schema.users.email, search),
    ))
  }
  const before = cursor ? or(
    sql`${schema.users.createdAt} < ${cursor.date}::timestamptz`,
    and(sql`${schema.users.createdAt} = ${cursor.date}::timestamptz`, lt(schema.users.id, cursor.id)),
  ) : undefined

  return await db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        avatarUrl: schema.users.avatarUrl,
        createdAt: schema.users.createdAt,
        lastLoginAt: schema.users.lastLoginAt,
        pageDate: sql<string>`to_char(${schema.users.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
      })
      .from(schema.users)
      .where(and(...conditions, before))
      .orderBy(desc(schema.users.createdAt), desc(schema.users.id))
      .limit(filters.limit + 1)
    const [total] = await tx.select({ count: count() }).from(schema.users).where(and(...conditions))
    const page = rows.slice(0, filters.limit)
    const last = page.at(-1)
    return {
      items: page.map(({ pageDate: _pageDate, ...user }) => user),
      total: total?.count ?? 0,
      nextCursor: rows.length > filters.limit && last ? writeAdminCursor('users', filters, { id: last.id, date: last.pageDate }) : null,
    }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}
