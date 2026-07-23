import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const organisationStatusEnum = pgEnum('organisation_status', [
  'DRAFT',
  'ACTIVE',
  'ARCHIVED',
])

export const organisationMemberRoleEnum = pgEnum('organisation_member_role', [
  'OWNER',
  'ADMIN',
  'RECRUITER',
])

export const organisations = pgTable(
  'organisations',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    status: organisationStatusEnum('status').notNull().default('DRAFT'),
    about: text('about'),
    websiteUrl: text('website_url'),
    logoUrl: text('logo_url'),
    countryCode: text('country_code'),
    city: text('city'),
    createdByUserID: integer('created_by_user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index('organisations_status_idx').on(table.status),
  ],
)

export const organisationMembers = pgTable(
  'organisation_members',
  {
    organisationID: integer('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    userID: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: organisationMemberRoleEnum('role').notNull().default('RECRUITER'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    primaryKey({ columns: [table.organisationID, table.userID] }),
    index('organisation_members_user_id_idx').on(table.userID),
  ],
)
