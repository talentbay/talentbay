import { afterAll, describe, expect, it, vi } from 'vitest'
import {
  findVacancyBySlug,
  searchVacancies,
} from '#server/services/vacancies/search-vacancies'
import { decodeVacancyCursor, encodeVacancyCursor, parseVacancySearch } from '#server/services/vacancies/search-query'
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Invalid search'), details))
afterAll(() => vi.unstubAllGlobals())

const baseQuery = {
  q: '',
  sort: 'newest' as const,
  limit: 20,
}

describe('searchVacancies', () => {
  it('returns published preview records in newest-first order', () => {
    const result = searchVacancies(baseQuery)

    expect(result.dataStatus).toBe('DEMO')
    expect(result.total).toBe(5)
    expect(result.items.map(item => item.id)).toEqual([1, 2, 3, 4, 5])
  })

  it('searches across role, company, location and skills', () => {
    expect(searchVacancies({ ...baseQuery, q: 'postgresql' }).items)
      .toHaveLength(2)
    expect(searchVacancies({ ...baseQuery, q: 'northstar' }).items[0]?.id)
      .toBe(2)
    expect(searchVacancies({ ...baseQuery, q: 'berlin' }).items[0]?.id)
      .toBe(4)
  })

  it('combines country and visa sponsorship filters', () => {
    const result = searchVacancies({
      ...baseQuery,
      countryCode: 'DE',
      visaSponsorship: true,
    })

    expect(result.items.map(item => item.id)).toEqual([4])
  })

  it('sorts salary only within one currency/period and respects the result limit', () => {
    const result = searchVacancies({
      ...baseQuery,
      sort: 'salary-desc',
      salaryCurrency: 'EUR', salaryPeriod: 'YEAR',
      limit: 2,
    })

    expect(result.total).toBe(4)
    expect(result.items.map(item => item.id)).toEqual([3, 2])
  })
  it('walks the full bounded demo catalogue without duplicates and preserves filter/limit binding', () => {
    const first = searchVacancies({ ...baseQuery, limit: 2 })
    const second = searchVacancies({ ...baseQuery, limit: 2, before: first.nextCursor! })
    const third = searchVacancies({ ...baseQuery, limit: 2, before: second.nextCursor! })
    expect([...first.items, ...second.items, ...third.items].map(item => item.id)).toEqual([1, 2, 3, 4, 5])
    expect(third.nextCursor).toBeNull()
    expect(third.total).toBe(5)
    expect(() => searchVacancies({ ...baseQuery, limit: 2, q: 'changed', before: first.nextCursor! })).toThrow()
    expect(() => searchVacancies({ ...baseQuery, before: first.nextCursor! })).toThrow()
  })
  it('rejects invalid bounds/units/cursors and keeps a microsecond timestamp exact', () => {
    for (const input of [
      { ...baseQuery, limit: 51 }, { ...baseQuery, limit: 0 }, { ...baseQuery, q: 'x'.repeat(101) },
      { ...baseQuery, sort: 'salary-desc' as const }, { ...baseQuery, before: 'bad' },
      { ...baseQuery, before: 'x'.repeat(513) },
    ]) expect(() => searchVacancies(input)).toThrow()
    const query = parseVacancySearch(baseQuery)
    const date = '2026-10-27T12:00:00.123456Z'
    const cursor = encodeVacancyCursor(query, { id: 123, date, salary: null })
    expect(decodeVacancyCursor({ ...query, before: cursor })).toMatchObject({ date, id: 123 })
    const bad = Buffer.from(JSON.stringify({ v: 1, id: -1, date, salary: null, filters: 'a'.repeat(64) })).toString('base64url')
    expect(() => decodeVacancyCursor({ ...query, before: bad })).toThrow()
  })
})

describe('findVacancyBySlug', () => {
  it('finds a known vacancy and returns undefined for an unknown slug', () => {
    expect(findVacancyBySlug('senior-backend-engineer-london')?.id).toBe(1)
    expect(findVacancyBySlug('missing-vacancy')).toBeUndefined()
  })
})
