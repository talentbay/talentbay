import {pgTable, text, serial, timestamp, pgEnum, jsonb, integer} from 'drizzle-orm/pg-core'
import { users } from '#server/db/schema/users'
import { vacancies } from '#server/db/schema/vacancies'
import { relations } from 'drizzle-orm'

export const organisations = pgTable('organisations', {
    id: serial().primaryKey(),
    name: text().notNull(),
    about: text(),
    country: text(),
    city: text(),
    createdAt: timestamp().notNull().defaultNow(),
    adminID: integer('adminID').references(() => users.id),
    users: integer('userID').references(() => users.id),
    vacancies: integer('vacancyID').references(() => vacancies.id)
})

export const orgRelations = relations(organisations, ({ many }) => ({
    users: many(users),
    vacancies: many(vacancies),
}));

export const orgAdminRelations = relations(organisations, ({ one }) => ({
    admin: one(users, {
        fields: [organisations.adminID],
        references: [users.id],
    }),
}))