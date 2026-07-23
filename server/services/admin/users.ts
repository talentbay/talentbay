import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'

export type AdminUserFilters = {
  query?: string
  role?: typeof schema.users.$inferSelect.role
}

export async function listAdminUsers(filters: AdminUserFilters) {
  const db = useDatabase()
  const conditions = []

  if (filters.role) {
    conditions.push(eq(schema.users.role, filters.role))
  }

  if (filters.query) {
    const search = `%${filters.query}%`
    conditions.push(or(
      ilike(schema.users.name, search),
      ilike(schema.users.email, search),
    ))
  }

  return await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      avatarUrl: schema.users.avatarUrl,
      createdAt: schema.users.createdAt,
      lastLoginAt: schema.users.lastLoginAt,
    })
    .from(schema.users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.users.createdAt))
    .limit(100)
}
