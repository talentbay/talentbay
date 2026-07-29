import { describe, expect, it } from 'vitest'
import {
  calculateAnnualTax,
  calculateRelocationPreview,
  calculateVerifiedRelocationPreview,
  isRelocationLocationKey,
} from '#server/services/relocation/calculate-preview'

describe('calculateRelocationPreview', () => {
  it('calculates the London monthly preview deterministically', () => {
    const result = calculateRelocationPreview('london', 110_000)

    expect(result.location).toMatchObject({
      city: 'London',
      countryCode: 'GB',
      currency: 'GBP',
    })
    expect(result.monthly).toEqual({
      gross: 9_167,
      netAfterTax: 6_417,
      rent: 2_200,
      livingCosts: 1_150,
      disposable: 3_067,
    })
    expect(result.dataStatus).toBe('DEMO')
  })

  it('allows a negative disposable estimate without hiding it', () => {
    const result = calculateRelocationPreview('london', 30_000)

    expect(result.monthly.disposable).toBeLessThan(0)
  })
})

describe('verified relocation calculation', () => {
  it('supports a progressive annual tax model and exposes provenance', () => {
    const result = calculateVerifiedRelocationPreview({
      key: 'sample-city',
      city: 'Sample City',
      countryCode: 'SC',
      currency: 'EUR',
      monthlyCosts: {
        rent: 1_000,
        utilities: 100,
        groceries: 300,
        transport: 100,
        healthcare: 50,
        other: 50,
      },
      oneTimeCosts: {
        flight: 500,
        visa: 250,
        deposit: 1_000,
        temporaryHousing: 500,
        other: 250,
      },
      taxModel: {
        type: 'progressive',
        personalAllowance: 10_000,
        brackets: [
          { upTo: 40_000, rateBps: 2_000 },
          { upTo: null, rateBps: 4_000 },
        ],
      },
      sources: [{
        label: 'Official source',
        url: 'https://example.com/source',
        accessedAt: '2026-07-23',
      }],
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      reviewedAt: new Date('2026-07-23T00:00:00.000Z'),
    }, 70_000)

    expect(result.dataStatus).toBe('VERIFIED')
    expect(result.monthly.netAfterTax).toBe(4_500)
    expect(result.monthly.livingCosts).toBe(600)
    expect(result.oneTimeMove).toBe(2_500)
    expect(result.provenance.sources).toHaveLength(1)
  })

  it('calculates effective-rate tax in basis points', () => {
    expect(calculateAnnualTax({
      type: 'effective_rate',
      rateBps: 2_500,
    }, 100_000)).toBe(25_000)
  })
})

describe('isRelocationLocationKey', () => {
  it('accepts supported locations only', () => {
    expect(isRelocationLocationKey('berlin')).toBe(true)
    expect(isRelocationLocationKey('new-york')).toBe(false)
  })
})
