import { describe, expect, it } from 'vitest'
import { reconcileEstimateDraft, vacancyEstimateSource } from '../../app/utils/relocation-draft'
import type { VacancySalary } from '../../shared/types/vacancies'

const london = { key: 'london', currency: 'GBP' }
const salary: VacancySalary = { min: 60_000, max: 80_000, currency: 'GBP', period: 'YEAR' }
const original = vacancyEstimateSource(london, salary)
const initial = () => reconcileEstimateDraft(undefined, original, 1)

describe('vacancy estimate draft', () => {
  it('keeps the selected endpoint when both advertised bounds change but the midpoint does not', () => {
    const next = vacancyEstimateSource(london, { ...salary, min: 55_000, max: 85_000 })
    for (const point of ['low', 'midpoint', 'high'] as const) {
      const selected = { ...initial(), basis: point, annualGross: original.range![point] }
      expect(reconcileEstimateDraft(selected, next, 1)).toMatchObject({ annualGross: next.range![point], basis: point })
    }
    expect(reconcileEstimateDraft({ ...initial(), annualGross: 65_000, basis: 'manual' }, next, 1))
      .toMatchObject({ annualGross: 65_000, basis: 'manual' })
  })

  it('annualizes monthly pay without rounding an odd yearly midpoint, pricing hourly pay or guessing FX', () => {
    expect(vacancyEstimateSource(london, { ...salary, min: 4999, max: 5000, period: 'MONTH' }).range)
      .toEqual({ low: 59988, midpoint: 59994, high: 60000 })
    expect(vacancyEstimateSource(london, { ...salary, min: 59999, max: 60000 }).annualGross).toBe(59999.5)
    expect(vacancyEstimateSource(london, { ...salary, period: 'HOUR' }).range).toBeNull()
    expect(vacancyEstimateSource(london, { ...salary, currency: 'EUR' }).range).toBeNull()
  })

  it('does not replace out-of-range pay with the calculator maximum', () => {
    const over = vacancyEstimateSource(london, { ...salary, min: 1_000_000, max: 4_000_000 })
    expect(over.annualGross).toBeNull()
    const high = { ...initial(), basis: 'high' as const, annualGross: original.range!.high }
    expect(reconcileEstimateDraft(high, over, 1)).toMatchObject({ annualGross: null, basis: null })
    expect(reconcileEstimateDraft(high, original, 2)).toMatchObject({ annualGross: 70_000, basis: 'midpoint' })
  })
  it('updates an untouched prefill but preserves an explicit edit, even for the same number', () => {
    const updated = vacancyEstimateSource(london, { ...salary, min: 80_000, max: 100_000 })
    expect(reconcileEstimateDraft(initial(), updated, 1).annualGross).toBe(90_000)
    const manual = { ...initial(), basis: 'manual' as const }
    expect(reconcileEstimateDraft(manual, { ...original }, 1)).toBe(manual)
    expect(reconcileEstimateDraft(manual, updated, 1)).toMatchObject({ annualGross: 70_000, basis: 'manual', source: updated })
  })

  it.each([
    ['currency mismatch', { ...salary, currency: 'USD' }],
    ['hourly pay', { ...salary, period: 'HOUR' as const }],
    ['undisclosed pay', null],
  ] as const)('clears a stale amount on reopen with %s', (_, changedSalary) => {
    const manual = { ...initial(), annualGross: 82_000, basis: 'manual' as const }
    const reopened = reconcileEstimateDraft(manual, vacancyEstimateSource(london, changedSalary), 1)
    expect(reopened).toMatchObject({ annualGross: null, basis: null })
    expect(reopened.notice).toContain('Vacancy salary or destination changed')
    expect(reconcileEstimateDraft(reopened, original, 1).annualGross).toBe(70_000)
  })

  it('resets destination and amount together, even for cities using the same currency', () => {
    const manual = { ...initial(), annualGross: 95_000, basis: 'manual' as const }
    const moved = vacancyEstimateSource({ key: 'edinburgh', currency: 'GBP' }, salary)
    expect(reconcileEstimateDraft(manual, moved, 1)).toMatchObject({ location: 'edinburgh', annualGross: 70_000, basis: 'midpoint' })
    const unavailable = vacancyEstimateSource(undefined, salary)
    expect(reconcileEstimateDraft(manual, unavailable, 1)).toMatchObject({ location: '', annualGross: null })
  })

  it('keeps a zero manual scenario on an unrelated refresh, but never across owners', () => {
    const manual = { ...initial(), annualGross: 0, basis: 'manual' as const }
    expect(reconcileEstimateDraft(manual, { ...original }, 1)).toBe(manual)
    expect(reconcileEstimateDraft(manual, original, null)).toMatchObject({ owner: null, annualGross: 70_000, basis: 'midpoint', notice: '' })
  })
})
