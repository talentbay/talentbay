import { and, count, desc, eq, sql } from 'drizzle-orm'
import { isDatabaseConfigured, schema, useDatabase } from '#server/db'
import {
  findVacancyBySlug as findDemoVacancyBySlug,
  searchVacancies as searchDemoVacancies,
} from '#server/services/vacancies/search-vacancies'
import type { VacancySearch } from '#server/services/vacancies/search-vacancies'
import type {
  VacancyDataStatus,
  VacancyListItem,
  VacancySearchResponse,
} from '#shared/types/vacancies'

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

export async function listVacancies(query: VacancySearch): Promise<VacancySearchResponse> {
  if (!isDatabaseConfigured()) {
    return searchDemoVacancies(query)
  }

  const db = useDatabase()
  const conditions = [
    eq(schema.vacancies.status, 'PUBLISHED'),
    eq(schema.organisations.status, 'ACTIVE'),
  ]

  if (query.q) {
    conditions.push(sql<boolean>`
      to_tsvector(
        'english',
        ${schema.vacancies.title}
        || ' '
        || coalesce(${schema.vacancies.summary}, '')
        || ' '
        || ${schema.vacancies.description}
      ) @@ websearch_to_tsquery('english', ${query.q})
    `)
  }

  if (query.countryCode) {
    conditions.push(eq(schema.vacancies.countryCode, query.countryCode))
  }

  if (query.workplaceType) {
    conditions.push(eq(schema.vacancies.workplaceType, query.workplaceType))
  }

  if (query.visaSponsorship) {
    conditions.push(eq(schema.vacancies.visaSponsorship, true))
  }

  if (query.salaryDisclosed) {
    conditions.push(sql<boolean>`${schema.vacancies.salaryMin} is not null`)
  }

  const where = and(...conditions)
  const orderBy = query.sort === 'salary-desc'
    ? [desc(schema.vacancies.salaryMax), desc(schema.vacancies.publishedAt)]
    : [desc(schema.vacancies.publishedAt)]

  const [rows, totals] = await Promise.all([
    db
      .select(vacancySelection)
      .from(schema.vacancies)
      .innerJoin(
        schema.organisations,
        eq(schema.vacancies.organisationID, schema.organisations.id),
      )
      .where(where)
      .orderBy(...orderBy)
      .limit(query.limit),
    db
      .select({ value: count() })
      .from(schema.vacancies)
      .innerJoin(
        schema.organisations,
        eq(schema.vacancies.organisationID, schema.organisations.id),
      )
      .where(where),
  ])

  const items = rows.map(toVacancyListItem)
  return {
    items,
    total: totals[0]?.value ?? 0,
    dataStatus: items.every(item => item.source.status === 'VERIFIED')
      ? 'VERIFIED'
      : 'DEMO',
  }
}

export async function getVacancyBySlug(slug: string): Promise<VacancyListItem | undefined> {
  if (!isDatabaseConfigured()) {
    return findDemoVacancyBySlug(slug)
  }

  const db = useDatabase()
  const [row] = await db
    .select(vacancySelection)
    .from(schema.vacancies)
    .innerJoin(
      schema.organisations,
      eq(schema.vacancies.organisationID, schema.organisations.id),
    )
    .where(and(
      eq(schema.vacancies.slug, slug),
      eq(schema.vacancies.status, 'PUBLISHED'),
      eq(schema.organisations.status, 'ACTIVE'),
    ))
    .limit(1)

  return row ? toVacancyListItem(row) : undefined
}

const vacancySelection = {
  id: schema.vacancies.id,
  slug: schema.vacancies.slug,
  title: schema.vacancies.title,
  summary: schema.vacancies.summary,
  description: schema.vacancies.description,
  companyName: schema.organisations.name,
  countryCode: schema.vacancies.countryCode,
  city: schema.vacancies.city,
  workplaceType: schema.vacancies.workplaceType,
  employmentType: schema.vacancies.employmentType,
  seniority: schema.vacancies.seniority,
  salaryMin: schema.vacancies.salaryMin,
  salaryMax: schema.vacancies.salaryMax,
  salaryCurrency: schema.vacancies.salaryCurrency,
  salaryPeriod: schema.vacancies.salaryPeriod,
  skills: schema.vacancies.skills,
  relocationOffered: schema.vacancies.relocationOffered,
  visaSponsorship: schema.vacancies.visaSponsorship,
  publishedAt: schema.vacancies.publishedAt,
  sourceName: schema.vacancies.sourceName,
  sourceUrl: schema.vacancies.sourceUrl,
  reviewStatus: schema.vacancies.reviewStatus,
}

type VacancyRecord = typeof schema.vacancies.$inferSelect
type VacancyRow = Pick<
  VacancyRecord,
  | 'id'
  | 'slug'
  | 'title'
  | 'summary'
  | 'description'
  | 'countryCode'
  | 'city'
  | 'workplaceType'
  | 'employmentType'
  | 'seniority'
  | 'salaryMin'
  | 'salaryMax'
  | 'salaryCurrency'
  | 'salaryPeriod'
  | 'skills'
  | 'relocationOffered'
  | 'visaSponsorship'
  | 'publishedAt'
  | 'sourceName'
  | 'sourceUrl'
  | 'reviewStatus'
> & {
  companyName: string
}

function toVacancyListItem(row: VacancyRow): VacancyListItem {
  const sourceStatus: VacancyDataStatus = row.reviewStatus === 'VERIFIED'
    ? 'VERIFIED'
    : 'DEMO'

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? '',
    description: row.description,
    company: {
      name: row.companyName,
      initials: getInitials(row.companyName),
    },
    location: {
      city: row.city,
      countryCode: row.countryCode,
      countryName: countryNames.of(row.countryCode) ?? row.countryCode,
    },
    workplaceType: row.workplaceType,
    employmentType: row.employmentType,
    seniority: row.seniority ?? 'Not specified',
    salary: row.salaryMin !== null
      && row.salaryMax !== null
      && row.salaryCurrency
      && row.salaryPeriod
      ? {
          min: row.salaryMin,
          max: row.salaryMax,
          currency: row.salaryCurrency,
          period: row.salaryPeriod,
        }
      : null,
    skills: row.skills,
    relocationOffered: row.relocationOffered,
    visaSponsorship: row.visaSponsorship,
    publishedAt: row.publishedAt?.toISOString() ?? new Date(0).toISOString(),
    source: {
      name: row.sourceName ?? 'TalentBay',
      url: row.sourceUrl,
      status: sourceStatus,
    },
  }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}
