import { z } from 'zod'
import { relocationPilotCities } from '#shared/relocation/geography'
import { monthlyCostsSchema, oneTimeCostsSchema, relocationSourceSchema, taxModelSchema } from './data-contract'

const note = z.string().trim().min(10).max(4000).refine(value => !value.includes('\0'))
const sourceGroup = z.enum(['TAX', 'RENT', 'LIVING', 'MOVE'])
const recordSchema = z.object({
  destination: z.enum(relocationPilotCities.map(city => city.key)),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(['DRAFT', 'VERIFIED', 'STALE']),
  monthlyCosts: monthlyCostsSchema, oneTimeCosts: oneTimeCostsSchema, taxModel: taxModelSchema,
  sources: z.array(relocationSourceSchema.extend({ covers: z.array(sourceGroup).min(1).max(4) })).min(1).max(40),
  effectiveFrom: z.iso.date(),
  assumptions: z.object({
    household: z.literal('ONE_ADULT'), employment: z.literal('SALARIED_EMPLOYEE'),
    taxResidency: note, taxYear: note, includedTaxes: z.array(note).min(1).max(20),
    excludedTaxes: z.array(note).max(20), housing: note, moveRoute: note,
    exclusions: z.array(note).min(1).max(20),
  }).strict(),
  review: z.object({
    at: z.iso.datetime({ offset: true }), by: note, reference: note, validUntil: z.iso.date(),
  }).strict().nullable(),
}).strict()

export const relocationDatasetSchema = z.object({
  schemaVersion: z.literal(1), purpose: z.enum(['SYNTHETIC', 'PILOT']),
  units: z.object({ amounts: z.literal('MAJOR_CURRENCY_UNITS'), income: z.literal('YEAR'), living: z.literal('MONTH'), move: z.literal('ONCE'), taxRates: z.literal('BASIS_POINTS') }).strict(),
  records: z.array(recordSchema).min(1).max(11),
}).strict().superRefine((dataset, context) => {
  const seen = new Set<string>()
  dataset.records.forEach((record, index) => {
    const add = (message: string) => context.addIssue({ code: 'custom', path: ['records', index], message })
    if (seen.has(record.destination)) add('Duplicate pilot destination')
    seen.add(record.destination)
    if (record.currency !== relocationPilotCities.find(city => city.key === record.destination)!.currency) add('Currency must match the pilot destination')
    if (dataset.purpose === 'SYNTHETIC' && record.status !== 'DRAFT') add('Synthetic data cannot be approved or stale production data')
    if (record.status === 'VERIFIED' && !record.review) add('Verified data requires a dated reviewer/reference and validity boundary')
    if (record.status === 'VERIFIED' && new Set(record.sources.flatMap(source => source.covers)).size !== 4) add('Verified data needs evidence for tax, rent, living and move costs')
    if (record.review) {
      const reviewDay = new Date(record.review.at).toISOString().slice(0, 10)
      if (record.effectiveFrom > reviewDay || record.review.validUntil < reviewDay || record.sources.some(source => source.accessedAt > reviewDay)) add('Source/effective/review/validity dates contradict each other')
    }
  })
})

export type RelocationDataset = z.infer<typeof relocationDatasetSchema>
export const relocationDatasetUnits = { amounts: 'MAJOR_CURRENCY_UNITS', income: 'YEAR', living: 'MONTH', move: 'ONCE', taxRates: 'BASIS_POINTS' } as const
export function relocationDatasetCoverage(dataset: RelocationDataset, today: string) {
  today = z.iso.date().parse(today)
  return relocationPilotCities.map((city) => {
    const record = dataset.records.find(record => record.destination === city.key)
    const reviewDay = record?.review ? new Date(record.review.at).toISOString().slice(0, 10) : null
    return { ...city, status: !record ? 'MISSING' : record.status === 'VERIFIED' && record.review && (record.review.validUntil < today || reviewDay! > today) ? 'STALE' : record.status }
  })
}
