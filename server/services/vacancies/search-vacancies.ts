import type { VacancyListItem, VacancySearchResponse } from '#shared/types/vacancies'
import { demoVacancies } from '#server/data/demo-catalog'
import { decodeVacancyCursor, encodeVacancyCursor, parseVacancySearch } from './search-query'
import type { VacancySearch } from './search-query'
export type { VacancySearch } from './search-query'

export function searchVacancies(input: VacancySearch): VacancySearchResponse {
  const query = parseVacancySearch(input)
  const cursor = decodeVacancyCursor(query)
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
      if (query.salaryCurrency && vacancy.salary?.currency !== query.salaryCurrency) return false
      if (query.salaryPeriod && vacancy.salary?.period !== query.salaryPeriod) return false

      return true
    })
    .sort((left, right) => {
      if (query.sort === 'salary-desc') {
        const salary = (right.salary?.max ?? 0) - (left.salary?.max ?? 0)
        if (salary) return salary
      }
      return Date.parse(right.publishedAt) - Date.parse(left.publishedAt) || right.id - left.id
    })
  const remaining = cursor ? items.filter(item => {
    if (query.sort === 'salary-desc' && item.salary!.max !== cursor.salary) return item.salary!.max < cursor.salary!
    const date = Date.parse(item.publishedAt) - (cursor.date ? Date.parse(cursor.date) : 0)
    return date < 0 || (date === 0 && item.id < cursor.id)
  }) : items
  const page = remaining.slice(0, query.limit)
  const last = page.at(-1)
  return {
    items: page,
    total: items.length,
    dataStatus: 'DEMO',
    nextCursor: remaining.length > query.limit && last ? encodeVacancyCursor(query, { id: last.id, date: last.publishedAt, salary: last.salary?.max ?? null }) : null,
  }
}

export function findVacancyBySlug(slug: string): VacancyListItem | undefined {
  return demoVacancies.find(vacancy => vacancy.slug === slug)
}
