import { describe, expect, it } from 'vitest'
import { annualGrossSchema, parseReviewedRelocation, relocationSourceSchema, taxModelSchema } from '#server/services/relocation/data-contract'
import { relocationPreviewQuery } from '#server/services/relocation/preview-query'
import { calculateAnnualTax, calculateRelocationPreview, calculateVerifiedRelocationPreview, isRelocationLocationKey } from '#server/services/relocation/calculate-preview'

const input = {
  key: 'synthetic', city: 'Synthetic City', countryCode: 'GB', currency: 'GBP',
  monthlyCosts: { rent: 1000, utilities: 100, groceries: 200, transport: 50, healthcare: 50, other: 100 },
  oneTimeCosts: { flight: 200, visa: 100, deposit: 1000, temporaryHousing: 300, other: 100 },
  taxModel: { type: 'effective_rate' as const, rateBps: 2000 },
  sources: [{ label: 'Synthetic only', url: 'https://example.invalid/source', accessedAt: '2026-01-01' }],
  effectiveFrom: new Date('2026-01-01T00:00:00Z'), reviewedAt: new Date('2026-01-02T00:00:00Z'),
}
const now = new Date('2026-10-27T12:00:00Z')

describe('relocation input and mathematical boundaries', () => {
  it('accepts zero and income up to the supported maximum in whole units or cents', () => {
    for (const value of [0, 0.01, 0.29, 60_000.01, 1_999_999.99, 2_000_000]) {
      expect(annualGrossSchema.parse(value)).toBe(value)
      for (const annualGross of [value, String(value), value.toFixed(2)]) {
        expect(relocationPreviewQuery.parse({ location: 'london', annualGross }).annualGross).toBe(value)
      }
    }
  })
  it('rejects excess precision, nonfinite, negative and out-of-range income on both entry paths', () => {
    for (const value of [60_000.001, 0.001, -0.01, 2_000_000.01, NaN, Infinity, -Infinity]) {
      expect(annualGrossSchema.safeParse(value).success).toBe(false)
      for (const annualGross of [value, String(value)]) {
        expect(relocationPreviewQuery.safeParse({ location: 'london', annualGross }).success).toBe(false)
      }
      expect(() => calculateRelocationPreview('london', value)).toThrow()
      expect(() => calculateVerifiedRelocationPreview(input, value)).toThrow()
      expect(() => calculateAnnualTax(input.taxModel, value)).toThrow()
    }
  })
  it('parses explicit decimal query amounts, never coerces blank/null/boolean/hex/arrays to money', () => {
    expect(relocationPreviewQuery.parse({ location: 'london', annualGross: '0' }).annualGross).toBe(0)
    expect(relocationPreviewQuery.parse({ location: 'london', annualGross: '123.45' }).annualGross).toBe(123.45)
    for (const value of ['', ' ', null, false, [], ['12'], '0xFF', '1e6', '1,000', '12.345', '0.000', '123.450', '012']) expect(relocationPreviewQuery.safeParse({ location: 'london', annualGross: value }).success).toBe(false)
    expect(relocationPreviewQuery.safeParse({ location: 'london' }).success).toBe(false)
    expect(relocationPreviewQuery.safeParse({ annualGross: 1000 }).success).toBe(false)
  })
  it('does not treat Object.prototype names as supported demo cities', () => {
    for (const value of ['constructor', '__proto__', 'toString']) expect(isRelocationLocationKey(value)).toBe(false)
  })
  it('requires ordered finite brackets, a single terminal infinity and bounded rates', () => {
    const model = { type: 'progressive' as const, personalAllowance: 10_000, brackets: [{ upTo: 40_000, rateBps: 2000 }, { upTo: null, rateBps: 4000 }] }
    expect(taxModelSchema.safeParse(model).success).toBe(true)
    for (const brackets of [[], [{ upTo: 40_000, rateBps: 2000 }], [{ upTo: null, rateBps: 1000 }, { upTo: null, rateBps: 2000 }], [{ upTo: 10, rateBps: 1000 }, { upTo: 10, rateBps: 2000 }, { upTo: null, rateBps: 2000 }], [{ upTo: -1, rateBps: 1000 }, { upTo: null, rateBps: 2000 }], [{ upTo: null, rateBps: 10_001 }]]) expect(taxModelSchema.safeParse({ ...model, brackets }).success).toBe(false)
    expect(taxModelSchema.safeParse({ type: 'effective_rate', rateBps: -1 }).success).toBe(false)
    expect(taxModelSchema.safeParse({ type: 'effective_rate', rateBps: 1.5 }).success).toBe(false)
    for (const [gross, tax] of [[0, 0], [10_000, 0], [10_001, 0.2], [50_000, 8000], [50_001, 8000.4], [2_000_000, 788_000]]) expect(calculateAnnualTax(model, gross!)).toBeCloseTo(tax!, 8)
  })
  it('does not apply the income precision limit to dataset costs or tax thresholds', () => {
    expect(parseReviewedRelocation({
      ...input,
      monthlyCosts: { ...input.monthlyCosts, rent: 1000.125 },
      oneTimeCosts: { ...input.oneTimeCosts, deposit: 900.375 },
      taxModel: { type: 'progressive', personalAllowance: 5000.125, brackets: [{ upTo: 10_000.125, rateBps: 2000 }, { upTo: null, rateBps: 4000 }] },
    }, now)).toBeDefined()
  })
  it('refuses malformed cost, source, review and effective dates even on a typed VERIFIED row', () => {
    expect(parseReviewedRelocation(input, now)).toBeDefined()
    for (const bad of [
      { monthlyCosts: { ...input.monthlyCosts, rent: -1 } },
      { monthlyCosts: { ...input.monthlyCosts, transport: null } },
      { oneTimeCosts: { ...input.oneTimeCosts, deposit: Infinity } },
      { sources: [] }, { reviewedAt: null }, { reviewedAt: new Date('invalid') },
      { currency: 'ZZZ' },
      { reviewedAt: new Date('2027-01-01') }, { effectiveFrom: new Date('2026-02-01') },
      { sources: [{ ...input.sources[0], accessedAt: '2026-02-30' }] },
      { sources: [{ ...input.sources[0], accessedAt: '2026-01-03' }] },
    ]) expect(parseReviewedRelocation({ ...input, ...bad }, now)).toBeUndefined()
    for (const url of ['not-a-url', 'javascript:alert(1)', 'https://user:pass@example.invalid/x']) expect(relocationSourceSchema.safeParse({ ...input.sources[0], url }).success).toBe(false)
  })
  it('rounds presentation once, retains negative disposable and keeps the moving budget separate', () => {
    const result = calculateVerifiedRelocationPreview(input, 0)
    expect(result.monthly).toEqual({ gross: 0, netAfterTax: 0, rent: 1000, livingCosts: 500, disposable: -1500 })
    expect(result.oneTimeMove).toBe(1700)
    expect(calculateVerifiedRelocationPreview(input, 12345.67).monthly).toEqual({ gross: 1029, netAfterTax: 823, rent: 1000, livingCosts: 500, disposable: -677 })
    expect(() => calculateVerifiedRelocationPreview({ ...input, sources: [] }, 1000)).toThrow('Unsupported relocation data')
  })
})
