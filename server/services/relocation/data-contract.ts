import { z } from 'zod'

export const maxAnnualGross = 2_000_000
const text = (min = 1, max = 2000) => z.string().trim().min(min).max(max).refine(value => !value.includes('\0'))
const amount = z.number().nonnegative().max(100_000_000)
const rate = z.number().int().min(0).max(10_000)
const supportedCurrencies = new Set(Intl.supportedValuesOf('currency'))
export const relocationCurrencySchema = z.string().regex(/^[A-Z]{3}$/).refine(value => supportedCurrencies.has(value), 'Currency is not supported by this runtime')
export const annualGrossSchema = z.number().nonnegative().max(maxAnnualGross)
export const monthlyCostsSchema = z.object({ rent: amount, utilities: amount, groceries: amount, transport: amount, healthcare: amount, other: amount }).strict()
export const oneTimeCostsSchema = z.object({ flight: amount, visa: amount, deposit: amount, temporaryHousing: amount, other: amount }).strict()
export const taxModelSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('effective_rate'), rateBps: rate }).strict(),
  z.object({
    type: z.literal('progressive'), personalAllowance: amount,
    brackets: z.array(z.object({ upTo: amount.positive().nullable(), rateBps: rate }).strict()).min(1).max(32),
  }).strict(),
]).superRefine((model, context) => {
  if (model.type !== 'progressive') return
  let previous = 0
  model.brackets.forEach((bracket, index) => {
    if (bracket.upTo === null ? index !== model.brackets.length - 1 : bracket.upTo <= previous || index === model.brackets.length - 1) {
      context.addIssue({ code: 'custom', path: ['brackets', index, 'upTo'], message: 'Increasing thresholds and exactly one terminal null bracket are required' })
    }
    if (bracket.upTo !== null) previous = bracket.upTo
  })
})

export const relocationSourceSchema = z.object({
  label: text(1, 160),
  url: z.url({ protocol: /^https?$/ }).max(2048).refine((value) => {
    try {
      const url = new URL(value)
      return !url.username && !url.password && !value.includes('\0')
    }
    catch { return false }
  }),
  accessedAt: z.iso.date(),
}).strict()

export const reviewedRelocationSchema = z.object({
  key: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  city: text(1, 120), countryCode: z.string().regex(/^[A-Z]{2}$/), currency: relocationCurrencySchema,
  monthlyCosts: monthlyCostsSchema, oneTimeCosts: oneTimeCostsSchema, taxModel: taxModelSchema,
  sources: z.array(relocationSourceSchema).min(1).max(40),
  effectiveFrom: z.date(), reviewedAt: z.date(),
}).strict()

/** Runtime checks are not subject-matter approval of the tax/cost assumptions. */
export function parseReviewedRelocation(value: unknown, now = new Date()) {
  const result = reviewedRelocationSchema.safeParse(value)
  if (!result.success) return undefined
  const row = result.data
  if (!Number.isFinite(now.getTime()) || row.effectiveFrom > row.reviewedAt || row.reviewedAt > now
    || row.sources.some(source => source.accessedAt > row.reviewedAt.toISOString().slice(0, 10))) return undefined
  return row
}
