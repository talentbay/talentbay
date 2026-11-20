export const vacancyCsvColumns = [
  'source_name', 'source_url', 'source_external_id', 'company_name', 'company_slug',
  'company_website_url', 'vacancy_slug', 'title', 'summary', 'description',
  'employment_type', 'workplace_type', 'seniority', 'country_code', 'city',
  'salary_min', 'salary_max', 'salary_currency', 'salary_period', 'skills',
  'relocation_offered', 'visa_sponsorship', 'source_published_at',
] as const

export type VacancyCsvColumn = typeof vacancyCsvColumns[number]
export type ImportIssue = { row: number, field: string, message: string }
export type ImportOperation = 'CREATED' | 'UPDATED' | 'UNCHANGED'
export type VacancyImportPreview = {
  valid: boolean
  rowCount: number
  issues: ImportIssue[]
  revision: string | null
  rows: { row: number, slug: string, title: string, company: string, operation: ImportOperation }[]
  summary: { created: number, updated: number, unchanged: number, withdrawnPublished: number }
}

export const vacancyCsvByteLimit = 512 * 1024
export const vacancyImportRowLimit = 50
export const editorialSourceName = 'TalentBay editorial'
