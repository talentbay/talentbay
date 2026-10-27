import { compile } from 'html-to-text'
import type { VacancyImportItem } from '#server/services/vacancies/import-schema'
import { vacancyImportItemSchema } from '#server/services/vacancies/import-schema'
import { leverPostingSchema, leverSourceSchema } from './lever-contract'
import type { LeverPosting, LeverSource, SourceRecordIssue } from './lever-contract'

const omitted = '[TalentBay source content omitted]'
const htmlText = compile({
  wordwrap: false,
  limits: { maxInputLength: 100_000, maxDepth: 100, maxChildNodes: 2_000, ellipsis: omitted },
  selectors: [
    { selector: 'script', format: 'skip' }, { selector: 'style', format: 'skip' }, { selector: 'img', format: 'skip' },
    { selector: 'a', options: { ignoreHref: true } },
  ],
})
const employment: Record<string, VacancyImportItem['vacancy']['employmentType']> = {
  'full-time': 'FULL_TIME', 'full time': 'FULL_TIME', 'fulltime': 'FULL_TIME',
  'part-time': 'PART_TIME', 'part time': 'PART_TIME', 'contract': 'CONTRACT', 'internship': 'INTERNSHIP', 'intern': 'INTERNSHIP',
}
const workplace = { 'on-site': 'ONSITE', hybrid: 'HYBRID', remote: 'REMOTE' } as const
const periods: Record<string, 'YEAR' | 'MONTH' | 'HOUR'> = {
  'per-year': 'YEAR', year: 'YEAR', yearly: 'YEAR', annual: 'YEAR',
  'per-month': 'MONTH', month: 'MONTH', monthly: 'MONTH', 'per-hour': 'HOUR', hour: 'HOUR', hourly: 'HOUR',
}
const recordIssueCodes = new Set(['UNSUPPORTED_EMPLOYMENT', 'UNSPECIFIED_WORKPLACE', 'UNRESOLVED_LOCATION', 'INVALID_SOURCE_URL', 'CONTENT_LIMIT', 'UNSUPPORTED_SALARY_PERIOD', 'INVALID_IMPORT_FIELDS'])
const descriptionText = (plain: string | null | undefined, html: string | null | undefined) => plain?.trim() || htmlText(html || '')

function normalizePosting(source: LeverSource, job: LeverPosting): VacancyImportItem {
  const id = job.id.toLowerCase()
  const commitment = job.categories.commitment.trim().toLowerCase()
  const employmentType = Object.hasOwn(employment, commitment) ? employment[commitment] : undefined
  if (!employmentType) throw new Error('UNSUPPORTED_EMPLOYMENT')
  if (job.workplaceType === 'unspecified') throw new Error('UNSPECIFIED_WORKPLACE')
  const location = job.categories.location && Object.hasOwn(source.locations, job.categories.location) ? source.locations[job.categories.location] : undefined
  const countryCode = job.country?.toUpperCase() || location?.countryCode
  if (!countryCode || (location && location.countryCode !== countryCode)) throw new Error('UNRESOLVED_LOCATION')
  const url = new URL(job.hostedUrl)
  const host = source.region === 'EU' ? 'jobs.eu.lever.co' : 'jobs.lever.co'
  if (url.protocol !== 'https:' || url.hostname !== host || url.port || url.username || url.password || url.pathname.toLowerCase() !== `/${source.site}/${id}`) throw new Error('INVALID_SOURCE_URL')
  url.search = ''; url.hash = ''
  const body = [
    descriptionText(job.descriptionPlain, job.description),
    ...job.lists.map(list => `${list.text}\n${htmlText(list.content)}`),
    descriptionText(job.additionalPlain, job.additional),
  ].filter(Boolean).join('\n\n').trim()
  if (body.length < 20) throw new Error('INVALID_IMPORT_FIELDS')
  const description = [body, job.salaryDescriptionPlain, job.categories.location ? `Source location: ${job.categories.location}` : null].filter(Boolean).join('\n\n')
  if (description.includes(omitted)) throw new Error('CONTENT_LIMIT')
  const salary = job.salaryRange
  const interval = salary?.interval.trim().toLowerCase()
  const period = interval && Object.hasOwn(periods, interval) ? periods[interval] : undefined
  if (salary && !period) throw new Error('UNSUPPORTED_SALARY_PERIOD')
  const result = vacancyImportItemSchema.safeParse({
    source: { name: `Lever:${source.region.toLowerCase()}:${source.site}`, externalId: id, url: url.href },
    company: source.company,
    vacancy: {
      slug: `lever-${source.region.toLowerCase()}-${source.site}-${id}`,
      title: job.text, description, employmentType, workplaceType: workplace[job.workplaceType],
      countryCode, city: location?.city,
      salary: salary ? { min: salary.min, max: salary.max, currency: salary.currency.toUpperCase(), period } : undefined,
      // Missing support fields are unconfirmed, not inferred from geography or prose.
      skills: [], relocationOffered: false, visaSponsorship: false,
    },
  })
  if (!result.success) throw new Error('INVALID_IMPORT_FIELDS')
  return result.data
}

export function normalizeLeverJobs(config: LeverSource, records: unknown[]) {
  const source = leverSourceSchema.parse(config)
  const items: VacancyImportItem[] = []
  const issues: SourceRecordIssue[] = []
  const seen = new Set<string>()
  if (records.length > 200) throw new Error('Source normalization is limited to 200 records')
  records.forEach((record, index) => {
    const parsed = leverPostingSchema.safeParse(record)
    if (!parsed.success) { issues.push({ index, id: null, code: 'INVALID_RECORD' }); return }
    const id = parsed.data.id.toLowerCase()
    if (seen.has(id)) { issues.push({ index, id, code: 'DUPLICATE_ID' }); return }
    seen.add(id)
    try { items.push(normalizePosting(source, parsed.data)) }
    catch (error) { issues.push({ index, id: parsed.data.id, code: error instanceof Error && recordIssueCodes.has(error.message) ? error.message : 'INVALID_RECORD' }) }
  })
  return { source: `Lever:${source.region.toLowerCase()}:${source.site}`, items, issues, recordCount: records.length }
}
