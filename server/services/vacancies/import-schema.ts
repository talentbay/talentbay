import { z } from 'zod'
import type { ImportIssue } from '#shared/types/vacancy-import'

const slugSchema = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const text = (maximum: number, minimum = 0) => z.string().trim().min(minimum).max(maximum).refine(value => !value.includes('\0'), 'NUL characters are not allowed')
const httpUrl = z.url({ protocol: /^https?$/ }).max(2048).refine(value => {
  try {
    const parsed = new URL(value)
    return !value.includes('\0') && !parsed.username && !parsed.password
  }
  catch { return false }
}, 'URLs must not contain credentials')
const salarySchema = z.object({
  min: z.number().int().nonnegative().max(2_147_483_647),
  max: z.number().int().positive().max(2_147_483_647),
  currency: z.string().trim().regex(/^[a-z]{3}$/i).transform(value => value.toUpperCase()),
  period: z.enum(['YEAR', 'MONTH', 'HOUR']),
}).refine(value => value.max >= value.min, { message: 'Salary maximum must be greater than or equal to minimum', path: ['max'] })

export const vacancyImportItemSchema = z.object({
  source: z.object({ name: text(120, 2), url: httpUrl, externalId: text(255, 1) }),
  company: z.object({ name: text(160, 2), slug: slugSchema, websiteUrl: httpUrl.optional() }),
  vacancy: z.object({
    slug: slugSchema, title: text(180, 2), summary: text(500).optional(),
    description: text(50_000, 20),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
    workplaceType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']), seniority: text(80).optional(),
    countryCode: z.string().trim().regex(/^[a-z]{2}$/i).transform(value => value.toUpperCase()), city: text(120).optional(),
    salary: salarySchema.optional(), skills: z.array(text(80, 1)).max(30).default([]),
    relocationOffered: z.boolean().default(false), visaSponsorship: z.boolean().default(false), sourcePublishedAt: z.iso.datetime({ offset: true }).optional(),
  }),
})
export type VacancyImportItem = z.infer<typeof vacancyImportItemSchema>

export function importBatchIssues(items: { row: number, item: VacancyImportItem }[]): ImportIssue[] {
  const sourceKeys = new Map<string, number>()
  const slugs = new Map<string, number>()
  const companies = new Map<string, { row: number, metadata: string }>()
  const issues: ImportIssue[] = []
  for (const { row, item } of items) {
    const sourceKey = JSON.stringify([item.source.name, item.source.externalId])
    const previousSource = sourceKeys.get(sourceKey)
    if (previousSource) issues.push({ row, field: 'source_external_id', message: `Duplicate source key from record ${previousSource}` })
    sourceKeys.set(sourceKey, row)
    const previousSlug = slugs.get(item.vacancy.slug)
    if (previousSlug) issues.push({ row, field: 'vacancy_slug', message: `Duplicate vacancy slug from record ${previousSlug}` })
    slugs.set(item.vacancy.slug, row)
    const metadata = JSON.stringify([item.company.name, item.company.websiteUrl || null])
    const previousCompany = companies.get(item.company.slug)
    if (previousCompany && previousCompany.metadata !== metadata) issues.push({ row, field: 'company_slug', message: `Company details contradict record ${previousCompany.row}` })
    companies.set(item.company.slug, { row, metadata })
  }
  return issues
}

export const vacancyImportRequestSchema = z.object({ items: z.array(vacancyImportItemSchema).min(1).max(50) }).superRefine(({ items }, context) => {
  for (const issue of importBatchIssues(items.map((item, index) => ({ row: index + 1, item })))) {
    context.addIssue({ code: 'custom', path: ['items', issue.row - 1], message: `${issue.field}: ${issue.message}` })
  }
})
