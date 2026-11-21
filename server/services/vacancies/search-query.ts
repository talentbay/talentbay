import { createHash } from 'node:crypto'
import { z } from 'zod'
import { companyKeySchema } from './company-filter'

export const vacancySearchSchema = z.object({
  q: z.string().trim().max(100).default(''),
  company: companyKeySchema.optional(),
  countryCode: z.string().regex(/^[a-z]{2}$/i).transform(value => value.toUpperCase()).optional(),
  workplaceType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
  visaSponsorship: z.boolean().default(false), salaryDisclosed: z.boolean().default(false),
  sort: z.enum(['newest', 'salary-desc']).default('newest'),
  salaryCurrency: z.string().regex(/^[a-z]{3}$/i).transform(value => value.toUpperCase()).optional(),
  salaryPeriod: z.enum(['YEAR', 'MONTH', 'HOUR']).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  before: z.string().min(1).max(512).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).strict().refine(query => query.sort !== 'salary-desc' || (query.salaryCurrency && query.salaryPeriod), {
  message: 'Salary sorting requires one currency and salary period', path: ['sort'],
})
export type VacancySearch = z.input<typeof vacancySearchSchema>
export type NormalizedVacancySearch = z.output<typeof vacancySearchSchema>
const cursorSchema = z.object({
  v: z.literal(1), id: z.number().int().positive().max(2_147_483_647),
  date: z.iso.datetime({ offset: true }).nullable(), salary: z.number().int().nonnegative().max(2_147_483_647).nullable(),
  filters: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()
export type VacancyCursor = z.infer<typeof cursorSchema>

export function parseVacancySearch(input: VacancySearch): NormalizedVacancySearch {
  const result = vacancySearchSchema.safeParse(input)
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy search or salary units' })
  return result.data
}
function fingerprint(query: NormalizedVacancySearch) {
  const { before: _before, ...filters } = query
  return createHash('sha256').update(JSON.stringify(filters)).digest('hex')
}
export function decodeVacancyCursor(query: NormalizedVacancySearch): VacancyCursor | null {
  if (!query.before) return null
  try {
    const bytes = Buffer.from(query.before, 'base64url')
    if (bytes.toString('base64url') !== query.before) throw new Error('encoding')
    const cursor = cursorSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
    if (cursor.filters !== fingerprint(query) || (query.sort === 'salary-desc' && cursor.salary === null)) throw new Error('filters')
    return cursor
  } catch { throw createError({ statusCode: 400, statusMessage: 'Invalid or changed vacancy cursor. Restart the search.' }) }
}
export function encodeVacancyCursor(query: NormalizedVacancySearch, row: { id: number; date: string | null; salary: number | null }) {
  return Buffer.from(JSON.stringify({ v: 1, ...row, filters: fingerprint(query) })).toString('base64url')
}
