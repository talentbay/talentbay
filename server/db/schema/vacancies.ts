import {pgTable, text, serial, timestamp, pgEnum, jsonb, integer} from 'drizzle-orm/pg-core'
import { organisations } from '#server/db/schema/organisations'
import { relations } from 'drizzle-orm'
import {users} from "#server/db/schema/users";

export const vacancies = pgTable('vacancies', {
    id: serial().primaryKey(),
    title: text().notNull(),
    orgID: integer('orgID').references(() => users.id),
})
