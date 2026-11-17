import { describe, expect, it } from 'vitest'
import example from '../../docs/examples/relocation-synthetic.v1.json'
import { relocationDatasetCoverage, relocationDatasetSchema } from '#server/services/relocation/dataset-contract'
import { relocationPilotCities } from '#shared/relocation/geography'

describe('fixed relocation dataset v1, not subject-matter approval', () => {
  it('keeps the confirmed11 cities and makes missing data explicit', () => {
    expect(relocationPilotCities.map(city => city.key)).toEqual(['dubai', 'london', 'berlin', 'lisbon', 'tallinn', 'belgrade', 'istanbul', 'tbilisi', 'bangkok', 'buenos-aires', 'mexico-city'])
    const coverage = relocationDatasetCoverage(relocationDatasetSchema.parse(example), '2026-10-27')
    expect(coverage.filter(city => city.status === 'MISSING')).toHaveLength(10)
    expect(coverage.find(city => city.key === 'london')!.status).toBe('DRAFT')
    expect(coverage.every(city => city.status !== 'VERIFIED')).toBe(true)
  })
  it('rejects wrong currency, duplicate/unknown cities, guessed fields and synthetic approval', () => {
    const first = example.records[0]!
    for (const records of [[first, first], [{ ...first, destination: 'amsterdam' }], [{ ...first, currency: 'USD' }], [{ ...first, status: 'VERIFIED' }], [{ ...first, automaticApproval: true }]]) expect(relocationDatasetSchema.safeParse({ ...example, records }).success).toBe(false)
  })
  it('requires review references, evidence groups and consistent dates, with explicit validity', () => {
    const record = { ...example.records[0]!, status: 'VERIFIED', review: { at: '2026-01-03T00:00:00Z', by: 'Fictional subject-matter reviewer', reference: 'Fictional approval reference only', validUntil: '2026-03-01' } }
    const dataset = relocationDatasetSchema.parse({ ...example, purpose: 'PILOT', records: [record] })
    expect(relocationDatasetCoverage(dataset, '2026-02-01').find(city => city.key === 'london')!.status).toBe('VERIFIED')
    expect(relocationDatasetCoverage(dataset, '2026-03-02').find(city => city.key === 'london')!.status).toBe('STALE')
    expect(relocationDatasetCoverage(dataset, '2026-01-02').find(city => city.key === 'london')!.status).toBe('STALE')
    for (const next of [{ ...record, review: null }, { ...record, review: { ...record.review, validUntil: '2026-01-01' } }, { ...record, sources: [{ ...record.sources[0], covers: ['RENT'] }] }]) expect(relocationDatasetSchema.safeParse({ ...example, purpose: 'PILOT', records: [next] }).success).toBe(false)
  })
})
