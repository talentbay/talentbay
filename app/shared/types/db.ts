import { users } from '@nuxthub/db/schema'

// User type
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
