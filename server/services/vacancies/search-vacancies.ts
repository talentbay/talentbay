import type { VacancyListItem, VacancySearchResponse } from '#shared/types/vacancies'
import { demoVacancies } from '#server/data/demo-catalog'

export type VacancySearch = {
  q: string
  countryCode?: string
  workplaceType?: VacancyListItem['workplaceType']
  visaSponsorship?: boolean
  salaryDisclosed?: boolean
  sort: 'newest' | 'salary-desc'
  limit: number
}

export function searchVacancies(query: VacancySearch): VacancySearchResponse {
  const normalizedQuery = query.q.toLocaleLowerCase('en')

  const items = demoVacancies
    .filter((vacancy) => {
      if (normalizedQuery) {
        const searchable = [
          vacancy.title,
          vacancy.company.name,
          vacancy.summary,
          vacancy.location.city,
          vacancy.location.countryName,
          ...vacancy.skills,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('en')

        if (!searchable.includes(normalizedQuery)) {
          return false
        }
      }

      if (query.countryCode && vacancy.location.countryCode !== query.countryCode) {
        return false
      }

      if (query.workplaceType && vacancy.workplaceType !== query.workplaceType) {
        return false
      }

      if (query.visaSponsorship && !vacancy.visaSponsorship) {
        return false
      }

      if (query.salaryDisclosed && !vacancy.salary) {
        return false
      }

      return true
    })
    .sort((left, right) => {
      if (query.sort === 'salary-desc') {
        return (right.salary?.max ?? 0) - (left.salary?.max ?? 0)
      }

      return Date.parse(right.publishedAt) - Date.parse(left.publishedAt)
    })

  return {
    items: items.slice(0, query.limit),
    total: items.length,
    dataStatus: 'DEMO',
  }
}

export function findVacancyBySlug(slug: string): VacancyListItem | undefined {
  return demoVacancies.find(vacancy => vacancy.slug === slug)
}
