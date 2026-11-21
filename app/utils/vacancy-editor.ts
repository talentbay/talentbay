import { editorialSourceName } from '#shared/types/vacancy-import'
import type { VacancyImportItem } from '#server/services/vacancies/import-schema'

type Details = VacancyImportItem['vacancy']
type EditorRecord = {
  revision: string
  company: { name: string, slug: string, websiteUrl: string | null }
  vacancy: Pick<Details, 'title' | 'slug' | 'countryCode' | 'description' | 'employmentType' | 'workplaceType' | 'skills' | 'visaSponsorship' | 'relocationOffered'> & {
    summary: string | null, city: string | null, seniority: string | null,
    sourceName: string | null, sourceExternalID: string | null, sourceUrl: string | null, sourcePublishedAt: string | null,
    salaryMin: number | null, salaryMax: number | null, salaryCurrency: string | null, salaryPeriod: NonNullable<Details['salary']>['period'] | null,
  }
}

export function editorSlug(text: string) {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 120).replace(/^-|-$/g, '')
}
export function vacancyEditorDraft(record?: EditorRecord) {
  const v = record?.vacancy
  return {
    title: v?.title ?? '', slug: v?.slug ?? '', description: v?.description ?? '', summary: v?.summary ?? '',
    country: v?.countryCode ?? '', city: v?.city ?? '', employment: v?.employmentType ?? 'FULL_TIME',
    workplace: v?.workplaceType ?? 'ONSITE', seniority: v?.seniority ?? '', skills: [...(v?.skills ?? [])],
    relocation: v?.relocationOffered ?? false, visa: v?.visaSponsorship ?? false,
    hasSalary: v?.salaryMin != null, min: String(v?.salaryMin ?? ''), max: String(v?.salaryMax ?? ''),
    currency: v?.salaryCurrency ?? '', period: v?.salaryPeriod ?? 'YEAR',
    company: record?.company.name ?? '', companySlug: record?.company.slug ?? '', website: record?.company.websiteUrl ?? '',
    external: !!v && v.sourceName !== editorialSourceName, sourceName: v?.sourceName ?? '', externalId: v?.sourceExternalID ?? '',
    url: v?.sourceUrl ?? '', sourcePublishedAt: v?.sourcePublishedAt ?? '',
  }
}
export function vacancyEditorItem(d: ReturnType<typeof vacancyEditorDraft>, editorialId: string): VacancyImportItem {
  const optional = (value: string) => value.trim() || undefined
  const integer = (value: string) => /^\d+$/.test(String(value).trim()) ? Number(value) : Number.NaN
  return {
    source: { name: d.external ? d.sourceName.trim() : editorialSourceName, externalId: d.external ? d.externalId.trim() : editorialId, url: optional(d.url) },
    company: { name: d.company.trim(), slug: d.companySlug.trim() || editorSlug(d.company), websiteUrl: optional(d.website) },
    vacancy: {
      title: d.title.trim(), slug: d.slug.trim() || editorSlug(d.title), description: d.description, summary: optional(d.summary),
      employmentType: d.employment, workplaceType: d.workplace, seniority: optional(d.seniority), countryCode: d.country.trim().toUpperCase(),
      city: optional(d.city), skills: [...d.skills], relocationOffered: d.relocation, visaSponsorship: d.visa,
      salary: d.hasSalary ? { min: integer(d.min), max: integer(d.max), currency: d.currency.trim().toUpperCase(), period: d.period } : undefined,
      sourcePublishedAt: optional(d.sourcePublishedAt),
    },
  }
}
