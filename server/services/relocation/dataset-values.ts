import { isDeepStrictEqual } from 'node:util'
import type { RelocationDatasetSnapshot } from '#shared/types/relocation-data'
import { relocationPilotCities } from '#shared/relocation/geography'
import { relocationDatasetCoverage, relocationDatasetSchema, relocationDatasetUnits } from './dataset-contract'
import type { RelocationDataset } from './dataset-contract'

export function datasetValues(purpose: RelocationDataset['purpose'], record: RelocationDataset['records'][number]) {
  const city = relocationPilotCities.find(city => city.key === record.destination)!
  const datasetSnapshot: RelocationDatasetSnapshot = { schemaVersion: 1, purpose, record }
  return {
    countryCode: city.countryCode, city: city.city, currency: record.currency, status: record.status,
    monthlyCosts: record.monthlyCosts, oneTimeCosts: record.oneTimeCosts, taxModel: record.taxModel,
    sources: record.sources.map(({ label, url, accessedAt }) => ({ label, url, accessedAt })),
    effectiveFrom: new Date(`${record.effectiveFrom}T00:00:00Z`),
    reviewedAt: record.review ? new Date(record.review.at) : null,
    datasetSnapshot,
  }
}
export type DatasetValues = ReturnType<typeof datasetValues>
export function sameDatasetValues(existing: { [K in keyof DatasetValues]: unknown }, next: DatasetValues) {
  return (Object.keys(next) as (keyof DatasetValues)[]).every(key => isDeepStrictEqual(existing[key], next[key]))
}

export function reviewedDatasetSnapshot(value: unknown, today: string) {
  if (!value || typeof value !== 'object' || !('record' in value) || !('purpose' in value) || !('schemaVersion' in value)) return undefined
  const parsed = relocationDatasetSchema.safeParse({ schemaVersion: value.schemaVersion, purpose: value.purpose, units: relocationDatasetUnits, records: [value.record] })
  if (!parsed.success || parsed.data.purpose !== 'PILOT') return undefined
  const record = parsed.data.records[0]!
  if (relocationDatasetCoverage(parsed.data, today).find(city => city.key === record.destination)?.status !== 'VERIFIED') return undefined
  return { record, values: datasetValues(parsed.data.purpose, record) }
}
