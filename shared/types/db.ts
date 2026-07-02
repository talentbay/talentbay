import type { users } from '#server/db/schema'

// User type
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
