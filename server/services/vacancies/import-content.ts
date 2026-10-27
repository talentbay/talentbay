import { isDeepStrictEqual } from 'node:util'
import type { schema } from '#server/db'
import type { VacancyImportItem } from './import-schema'

export function importedVacancyContent(item: VacancyImportItem, organisationID: number) {
  return {
    organisationID, slug: item.vacancy.slug, title: item.vacancy.title,
    summary: item.vacancy.summary ?? null, description: item.vacancy.description,
    employmentType: item.vacancy.employmentType, workplaceType: item.vacancy.workplaceType,
    seniority: item.vacancy.seniority ?? null, countryCode: item.vacancy.countryCode, city: item.vacancy.city ?? null,
    salaryMin: item.vacancy.salary?.min ?? null, salaryMax: item.vacancy.salary?.max ?? null,
    salaryCurrency: item.vacancy.salary?.currency ?? null, salaryPeriod: item.vacancy.salary?.period ?? null,
    skills: [...new Set(item.vacancy.skills)], relocationOffered: item.vacancy.relocationOffered, visaSponsorship: item.vacancy.visaSponsorship,
    sourceName: item.source.name, sourceUrl: item.source.url, sourceExternalID: item.source.externalId,
    sourcePublishedAt: item.vacancy.sourcePublishedAt ? new Date(item.vacancy.sourcePublishedAt) : null,
  }
}

export function reviewedVacancyState(vacancy: typeof schema.vacancies.$inferSelect) {
  // Refreshing observations must not invalidate a current review or content preview.
  const { lastImportedAt: _imported, sourceFetchedAt: _fetched, ...state } = vacancy
  return state
}
export function sameImportedContent(existing: typeof schema.vacancies.$inferSelect, next: ReturnType<typeof importedVacancyContent>) {
  return (Object.keys(next) as (keyof typeof next)[]).every(key => isDeepStrictEqual(existing[key], next[key]))
}
