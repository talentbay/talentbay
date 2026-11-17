import { check, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { VacancyImportItem } from '#server/services/vacancies/import-schema'
import type { SourceRunReport } from '#shared/types/source-import'
import { users } from './users'

export const sourceRunState = pgEnum('source_run_state', ['FETCHING', 'READY', 'IMPORTED', 'FAILED'])

// One bounded, replaceable checkpoint per approved source, not a raw-response archive.
export const sourceImports = pgTable('source_imports', {
  sourceKey: text('source_key').primaryKey(),
  runID: uuid('run_id').notNull(),
  configRevision: text('config_revision').notNull(),
  state: sourceRunState('state').notNull(),
  actorUserID: integer('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  retryAfterAt: timestamp('retry_after_at', { withTimezone: true }),
  nextOffset: integer('next_offset').notNull().default(0),
  items: jsonb('items').$type<VacancyImportItem[]>(),
  previewRevision: text('preview_revision'),
  lastCommitRevision: text('last_commit_revision'),
  lastCommitOffset: integer('last_commit_offset'),
  report: jsonb('report').$type<SourceRunReport>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [check('source_imports_offset_bounds', sql`${table.nextOffset} between 0 and 200`)])
