import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { handlingEventKinds, handlingStages } from '../../../shared/types/application-handling'
import type { ApplicationSnapshot, HandlingEventData } from '../../../shared/types/application-handling'
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

export const handlingStageEnum = pgEnum('application_handling_stage', handlingStages)
export const handlingEventKindEnum = pgEnum('application_handling_event_kind', handlingEventKinds)

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
    submissionSnapshot: jsonb('submission_snapshot').$type<ApplicationSnapshot>(),
    handlingStage: handlingStageEnum('handling_stage').notNull().default('RECEIVED'),
    handlingRevision: integer('handling_revision').notNull().default(0),
    assignedUserID: integer('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
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
    index('applications_handling_queue_idx').on(table.handlingStage, table.id),
    index('applications_assignee_queue_idx').on(table.assignedUserID, table.id),
  ],
)

export const applicationHandlingEvents = pgTable('application_handling_events', {
  id: serial('id').primaryKey(),
  applicationID: integer('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  revision: integer('revision').notNull(),
  kind: handlingEventKindEnum('kind').notNull(),
  stage: handlingStageEnum('stage').notNull(),
  actorUserID: integer('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  commandKey: uuid('command_key'),
  commandDigest: text('command_digest'),
  data: jsonb('data').$type<HandlingEventData>().notNull().default({}),
  privateNote: text('private_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex('application_events_revision_idx').on(table.applicationID, table.revision),
  uniqueIndex('application_events_command_idx').on(table.applicationID, table.commandKey),
])
