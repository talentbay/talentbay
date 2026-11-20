import { describe, expect, it } from 'vitest'
import { calculateAnnualTax } from '#server/services/relocation/calculate-preview'
import type { TaxCalculationModel } from '#shared/types/relocation-data'

// Synthetic annual income-tax comparison only; not a London dataset or a payroll model.
const continuousGrossBands: TaxCalculationModel = {
  type: 'progressive',
  personalAllowance: 0,
  brackets: [
    { upTo: 12_570, rateBps: 0 },
    { upTo: 50_270, rateBps: 2_000 },
    { upTo: 100_000, rateBps: 4_000 },
    { upTo: 125_140, rateBps: 6_000 },
    { upTo: null, rateBps: 4_500 },
  ],
}

describe('London review reference: annual income tax only', () => {
  it.each([
    [60_000, 11_432],
    [100_000, 27_432],
    [110_000, 33_432],
    [125_140, 42_516],
    [150_000, 53_703],
  ])('matches the hand-worked example at GBP %i gross', (gross, expectedTax) => {
    expect(calculateAnnualTax(continuousGrossBands, gross)).toBe(expectedTax)
  })

  it('distinguishes the rounded allowance from the continuous bands at GBP 100,001', () => {
    const gross = 100_001
    // Income Tax Act 2007, s35(3): round the remaining allowance up, not the tax.
    // https://www.legislation.gov.uk/ukpga/2007/3/section/35
    const allowance = Math.ceil(12_570 - (gross - 100_000) / 2)
    expect(allowance).toBe(12_570)
    const higherRateIncome = gross - allowance - 37_700
    const roundedAllowanceTaxPence = 37_700 * 20 + higherRateIncome * 40
    expect(roundedAllowanceTaxPence / 100).toBe(27_432.40)
    expect(calculateAnnualTax(continuousGrossBands, gross)).toBeCloseTo(27_432.60, 8)
  })
})
