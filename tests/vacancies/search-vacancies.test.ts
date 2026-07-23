import { describe, expect, it } from 'vitest'
import {
  findVacancyBySlug,
  searchVacancies,
} from '#server/services/vacancies/search-vacancies'

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

  it('sorts by maximum salary and respects the result limit', () => {
    const result = searchVacancies({
      ...baseQuery,
      sort: 'salary-desc',
      limit: 2,
    })

    expect(result.total).toBe(5)
    expect(result.items.map(item => item.id)).toEqual([3, 1])
  })
})

describe('findVacancyBySlug', () => {
  it('finds a known vacancy and returns undefined for an unknown slug', () => {
    expect(findVacancyBySlug('senior-backend-engineer-london')?.id).toBe(1)
    expect(findVacancyBySlug('missing-vacancy')).toBeUndefined()
  })
})
