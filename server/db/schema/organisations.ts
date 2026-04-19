import { pgTable, text, serial, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
    id: serial().primaryKey(),
    name: text().notNull(),
    about: text(),
    country: text(),
    city: text(),
    createdAt: timestamp().notNull().defaultNow(),
})