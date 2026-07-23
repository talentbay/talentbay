import { describe, expect, it } from 'vitest'
import {
  calculateRelocationPreview,
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

describe('isRelocationLocationKey', () => {
  it('accepts supported locations only', () => {
    expect(isRelocationLocationKey('berlin')).toBe(true)
    expect(isRelocationLocationKey('new-york')).toBe(false)
  })
})
