import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
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

export const applications = pgTable(
  'applications',
  {
    id: serial('id').primaryKey(),
    userID: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    vacancyID: integer('vacancy_id')
      .notNull()
      .references(() => vacancies.id, { onDelete: 'cascade' }),
    status: applicationStatusEnum('status').notNull().default('NEW'),
    coverLetter: text('cover_letter'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    uniqueIndex('applications_user_vacancy_idx').on(table.userID, table.vacancyID),
    index('applications_vacancy_status_idx').on(table.vacancyID, table.status),
    index('applications_user_created_at_idx').on(table.userID, table.createdAt),
  ],
)
