import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export type MonthlyLivingCosts = {
  rent: number
  utilities: number
  groceries: number
  transport: number
  healthcare: number
  other: number
}

export type OneTimeRelocationCosts = {
  flight: number
  visa: number
  deposit: number
  temporaryHousing: number
  other: number
}

export type TaxCalculationModel =
  | {
      type: 'effective_rate'
      rateBps: number
    }
  | {
      type: 'progressive'
      personalAllowance: number
      brackets: Array<{
        upTo: number | null
        rateBps: number
      }>
    }

export type RelocationSource = {
  label: string
  url: string
  accessedAt: string
}

export const relocationDataStatusEnum = pgEnum('relocation_data_status', [
  'DRAFT',
  'VERIFIED',
  'STALE',
])

export const relocationLocations = pgTable(
  'relocation_locations',
  {
    id: serial('id').primaryKey(),
    countryCode: text('country_code').notNull(),
    city: text('city').notNull(),
    currency: text('currency').notNull(),
    status: relocationDataStatusEnum('status').notNull().default('DRAFT'),
    monthlyCosts: jsonb('monthly_costs').$type<MonthlyLivingCosts>().notNull(),
    oneTimeCosts: jsonb('one_time_costs').$type<OneTimeRelocationCosts>().notNull(),
    taxModel: jsonb('tax_model').$type<TaxCalculationModel>().notNull(),
    sources: jsonb('sources').$type<RelocationSource[]>().notNull().default([]),
    notes: text('notes'),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    uniqueIndex('relocation_locations_country_city_idx')
      .on(table.countryCode, table.city),
    index('relocation_locations_status_idx').on(table.status),
  ],
)
