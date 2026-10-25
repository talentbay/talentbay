import { describe, expect, it } from 'vitest'
import { parseSavedVacancies } from '../../app/utils/saved-vacancies'
import { profileSections } from '../../app/utils/candidate-profile'
import { applicationStatuses } from '../../app/utils/application-status'
import { annualSalaryMidpoint, formatVacancySalary } from '../../app/utils/vacancy-salary'
import { safeHttpUrl } from '../../app/utils/safe-http-url'
import { relocationPreviewQuery } from '#server/services/relocation/preview-query'

describe('candidate presentation contracts', () => {
  it('reads local shortlists without duplicates or unsafe slugs', () => {
    expect(parseSavedVacancies('["valid-role","valid-role","../../admin","javascript:bad",null,42]')).toEqual(['valid-role'])
    expect(parseSavedVacancies('broken')).toEqual([])
    expect(parseSavedVacancies('{"role":true}')).toEqual([])
  })
  it('does not evict pre-existing valid saves when the new-save limit is reached', () => {
    const slugs = Array.from({ length: 230 }, (_, index) => `role-${index}`)
    expect(parseSavedVacancies(JSON.stringify(slugs))).toEqual(slugs)
  })
  it('counts only completed profile sections, not account identity', () => {
    expect(profileSections(null).filter(value => value.complete)).toHaveLength(0)
    expect(profileSections({ headline: ' ', city: 'Berlin', countryCode: null, about: '', phone: '123', telegram: null, githubUrl: null, linkedinUrl: null }).filter(value => value.complete).map(value => value.label)).toEqual(['Location', 'Contact'])
  })
  it('treats an offer as active, not a fabricated completed hire', () => {
    expect(applicationStatuses.NEW.label).toBe('Submitted')
    expect(applicationStatuses.OFFER.closed).toBe(false)
    expect(applicationStatuses.REJECTED.closed).toBe(true)
    expect(applicationStatuses.WITHDRAWN.closed).toBe(true)
  })
  it('distinguishes salary periods and never assumes hourly working time', () => {
    const salary = { min: 4000, max: 6000, currency: 'EUR', period: 'MONTH' as const }
    expect(annualSalaryMidpoint(salary)).toBe(60_000)
    expect(annualSalaryMidpoint({ ...salary, period: 'YEAR' })).toBe(5000)
    expect(annualSalaryMidpoint({ ...salary, period: 'HOUR' })).toBeNull()
    expect(formatVacancySalary(salary)).toContain('/ month')
    expect(formatVacancySalary(null)).toBe('Salary not disclosed')
  })
  it('formats compact currency consistently for server and browser hydration', () => {
    expect(formatVacancySalary({ min: 95000, max: 125000, currency: 'GBP', period: 'YEAR' })).toBe('£95K–£125K / year')
    expect(formatVacancySalary({ min: 95500, max: 125500, currency: 'GBP', period: 'YEAR' })).toBe('£95.5K–£125.5K / year')
  })
  it('does not turn invalid calculation inputs into a successful default estimate', () => {
    expect(relocationPreviewQuery.safeParse({ annualGross: -1 }).success).toBe(false)
    expect(relocationPreviewQuery.safeParse({ annualGross: 'not-a-number' }).success).toBe(false)
    expect(relocationPreviewQuery.safeParse({ location: '../../admin' }).success).toBe(false)
  })
  it('does not render unsafe legacy external URLs as links', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeHttpUrl('https://secret@example.com')).toBeUndefined()
    expect(safeHttpUrl('https://github.com/example')).toBe('https://github.com/example')
  })
})
