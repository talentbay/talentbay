import { pgTable, serial, integer, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { vacancies } from './vacancies'

// Breakdown of monthly living costs, all values in the vacancy currency.
type CostOfLiving = {
    rent: number
    utilities: number
    food: number
    transport: number
    health: number
    other: number
}

export const relocationData = pgTable('relocation_data', {
    id: serial().primaryKey(),
    vacancyID: integer('vacancyID')
        .notNull()
        .references(() => vacancies.id),
    country: text('country').notNull(),
    city: text('city'),
    currency: text('currency').notNull().default('USD'),
    // Gross monthly salary in minor units (cents) to avoid float rounding.
    grossMonthly: integer('grossMonthly').notNull(),
    // Effective income-tax + social contributions rate, basis points (e.g. 2350 = 23.5%).
    taxRateBps: integer('taxRateBps').notNull().default(0),
    // Estimated net monthly income after tax, minor units.
    netMonthly: integer('netMonthly'),
    // One-off relocation cost estimate (visa, flights, deposit), minor units.
    relocationCost: integer('relocationCost'),
    costOfLiving: jsonb('costOfLiving').$type<CostOfLiving>(),
    notes: text('notes'),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow(),
})

export const relocationDataRelations = relations(relocationData, ({ one }) => ({
    vacancy: one(vacancies, {
        fields: [relocationData.vacancyID],
        references: [vacancies.id],
    }),
}))
