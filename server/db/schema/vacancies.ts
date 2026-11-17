import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { organisations } from './organisations'
import { relocationLocations } from './relocation'
import { users } from './users'

export const vacancyStatusEnum = pgEnum('vacancy_status', [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
])

export const vacancyReviewStatusEnum = pgEnum('vacancy_review_status', [
  'UNREVIEWED',
  'VERIFIED',
  'FLAGGED',
])

export const employmentTypeEnum = pgEnum('employment_type', [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
])

export const workplaceTypeEnum = pgEnum('workplace_type', [
  'ONSITE',
  'HYBRID',
  'REMOTE',
])

export const salaryPeriodEnum = pgEnum('salary_period', [
  'YEAR',
  'MONTH',
  'HOUR',
])

export const vacancies = pgTable(
  'vacancies',
  {
    id: serial('id').primaryKey(),
    organisationID: integer('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'restrict' }),
    relocationLocationID: integer('relocation_location_id')
      .references(() => relocationLocations.id, { onDelete: 'set null' }),
    createdByUserID: integer('created_by_user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary'),
    description: text('description').notNull(),
    status: vacancyStatusEnum('status').notNull().default('DRAFT'),
    reviewStatus: vacancyReviewStatusEnum('review_status')
      .notNull()
      .default('UNREVIEWED'),
    employmentType: employmentTypeEnum('employment_type').notNull(),
    workplaceType: workplaceTypeEnum('workplace_type').notNull(),
    seniority: text('seniority'),
    countryCode: text('country_code').notNull(),
    city: text('city'),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    salaryCurrency: text('salary_currency'),
    salaryPeriod: salaryPeriodEnum('salary_period'),
    skills: text('skills').array().notNull().default(sql`'{}'::text[]`),
    relocationOffered: boolean('relocation_offered').notNull().default(false),
    visaSponsorship: boolean('visa_sponsorship').notNull().default(false),
    sourceName: text('source_name'),
    sourceUrl: text('source_url'),
    sourceExternalID: text('source_external_id'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    // Legacy ordering above is preserved; its provenance cannot be inferred retroactively.
    talentbayPublishedAt: timestamp('talentbay_published_at', { withTimezone: true, precision: 3 }),
    sourcePublishedAt: timestamp('source_published_at', { withTimezone: true, precision: 3 }),
    sourceFetchedAt: timestamp('source_fetched_at', { withTimezone: true, precision: 3 }),
    lastImportedAt: timestamp('last_imported_at', { withTimezone: true, precision: 3 }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, precision: 3 }),
    reviewedByUserID: integer('reviewed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index('vacancies_organisation_id_idx').on(table.organisationID),
    index('vacancies_relocation_location_id_idx').on(table.relocationLocationID),
    index('vacancies_status_published_at_idx').on(table.status, table.publishedAt),
    index('vacancies_location_idx').on(table.countryCode, table.city),
    uniqueIndex('vacancies_source_external_id_idx')
      .on(table.sourceName, table.sourceExternalID),
    index('vacancies_search_idx').using(
      'gin',
      sql`to_tsvector('english', ${table.title} || ' ' || coalesce(${table.summary}, '') || ' ' || ${table.description})`,
    ),
  ],
)
