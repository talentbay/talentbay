import { describe, expect, it } from 'vitest'
import { formatVacancyDate, vacancyPublicationAge } from '../../app/utils/vacancy-dates'

describe('vacancy date presentation', () => {
  it('leaves missing and invalid facts unknown instead of inventing freshness', () => {
    for (const value of [null, undefined, '', 'invalid']) expect(formatVacancyDate(value)).toBe('Not recorded')
    for (const value of [null, '', 'invalid']) expect(vacancyPublicationAge(value)).toBeNull()
  })
  it('formats the same instant in UTC, not the viewer timezone', () => {
    expect(formatVacancyDate('2026-01-02T02:30:00+03:00')).toBe('Jan 1, 2026, 23:30 UTC')
  })
  it('only ages a recorded publication, and rejects future dates', () => {
    const now = Date.parse('2026-10-27T12:00:00Z')
    expect(vacancyPublicationAge('2026-10-27T10:00:00Z', now)).toBe('Today')
    expect(vacancyPublicationAge('2026-10-25T10:00:00Z', now)).toBe('2d ago')
    expect(vacancyPublicationAge('2026-10-28T10:00:00Z', now)).toBeNull()
  })
})
