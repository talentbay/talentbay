import { describe, expect, it } from 'vitest'
import { reconcileEstimateDraft, vacancyEstimateSource } from '../../app/utils/relocation-draft'
import type { VacancySalary } from '../../shared/types/vacancies'

const london = { key: 'london', currency: 'GBP' }
const salary: VacancySalary = { min: 60_000, max: 80_000, currency: 'GBP', period: 'YEAR' }
const original = vacancyEstimateSource(london, salary)
const initial = () => reconcileEstimateDraft(undefined, original, 1)

describe('vacancy estimate draft', () => {
  it('updates an untouched prefill but preserves an explicit edit, even for the same number', () => {
    const updated = vacancyEstimateSource(london, { ...salary, min: 80_000, max: 100_000 })
    expect(reconcileEstimateDraft(initial(), updated, 1).annualGross).toBe(90_000)
    const manual = { ...initial(), manualGross: true }
    expect(reconcileEstimateDraft(manual, { ...original }, 1)).toBe(manual)
    expect(reconcileEstimateDraft(manual, updated, 1)).toMatchObject({ annualGross: 70_000, manualGross: true, source: updated })
  })

  it.each([
    ['currency mismatch', { ...salary, currency: 'USD' }],
    ['hourly pay', { ...salary, period: 'HOUR' as const }],
    ['undisclosed pay', null],
  ] as const)('clears a stale amount on reopen with %s', (_, changedSalary) => {
    const manual = { ...initial(), annualGross: 82_000, manualGross: true }
    const reopened = reconcileEstimateDraft(manual, vacancyEstimateSource(london, changedSalary), 1)
    expect(reopened).toMatchObject({ annualGross: null, manualGross: false })
    expect(reopened.notice).toContain('Vacancy salary or destination changed')
    expect(reconcileEstimateDraft(reopened, original, 1).annualGross).toBe(70_000)
  })

  it('resets destination and amount together, even for cities using the same currency', () => {
    const manual = { ...initial(), annualGross: 95_000, manualGross: true }
    const moved = vacancyEstimateSource({ key: 'edinburgh', currency: 'GBP' }, salary)
    expect(reconcileEstimateDraft(manual, moved, 1)).toMatchObject({ location: 'edinburgh', annualGross: 70_000, manualGross: false })
    const unavailable = vacancyEstimateSource(undefined, salary)
    expect(reconcileEstimateDraft(manual, unavailable, 1)).toMatchObject({ location: '', annualGross: null })
  })

  it('keeps a zero manual scenario on an unrelated refresh, but never across owners', () => {
    const manual = { ...initial(), annualGross: 0, manualGross: true }
    expect(reconcileEstimateDraft(manual, { ...original }, 1)).toBe(manual)
    expect(reconcileEstimateDraft(manual, original, null)).toMatchObject({ owner: null, annualGross: 70_000, manualGross: false, notice: '' })
  })
})
