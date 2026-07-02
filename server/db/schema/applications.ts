import { pgTable, serial, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { vacancies } from './vacancies'

export const applicationStatusEnum = pgEnum('application_status', [
    'NEW',
    'VIEWED',
    'INTERVIEW',
    'OFFER',
    'REJECTED',
    'WITHDRAWN',
])

export const applications = pgTable('applications', {
    id: serial().primaryKey(),
    userID: integer('userID')
        .notNull()
        .references(() => users.id),
    vacancyID: integer('vacancyID')
        .notNull()
        .references(() => vacancies.id),
    status: applicationStatusEnum('status').notNull().default('NEW'),
    coverLetter: text('coverLetter'),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
})

export const applicationsRelations = relations(applications, ({ one }) => ({
    user: one(users, {
        fields: [applications.userID],
        references: [users.id],
    }),
    vacancy: one(vacancies, {
        fields: [applications.vacancyID],
        references: [vacancies.id],
    }),
}))
