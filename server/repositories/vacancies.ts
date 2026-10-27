import { and, count, eq, inArray, or, sql } from 'drizzle-orm'
import { isDatabaseConfigured, schema, useDatabase } from '#server/db'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'
import {
  findVacancyBySlug as findDemoVacancyBySlug,
  searchVacancies as searchDemoVacancies,
} from '#server/services/vacancies/search-vacancies'
import type { VacancySearch } from '#server/services/vacancies/search-vacancies'
import { decodeVacancyCursor, encodeVacancyCursor, parseVacancySearch } from '#server/services/vacancies/search-query'
import { olderVacancies, pageDate, salaryPresent, vacancyOrder } from './vacancy-page'
import { applicationContextRevision, applicationContextSelection } from '#server/services/vacancies/application-context'
import type { ApplicationContextRow } from '#server/services/vacancies/application-context'
import type {
  VacancyDataStatus,
  VacancyListItem,
  VacancyResolveResponse,
  VacancySearchResponse,
} from '#shared/types/vacancies'

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

export async function resolveVacancies(slugs: string[]): Promise<VacancyResolveResponse> {
  const unique = [...new Set(slugs)]
  const items = !isDatabaseConfigured()
    ? unique.flatMap(slug => findDemoVacancyBySlug(slug) ?? [])
    : (await useDatabase().select(vacancySelection).from(schema.vacancies)
        .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
        .where(and(publicVacancyConditions(), inArray(schema.vacancies.slug, unique))))
        .map(toVacancyListItem)
  const bySlug = new Map(items.map(item => [item.slug, item]))
  return {
    items: unique.flatMap(slug => bySlug.get(slug) ?? []),
    unavailableSlugs: unique.filter(slug => !bySlug.has(slug)),
  }
}

export async function listVacancies(input: VacancySearch): Promise<VacancySearchResponse> {
  const query = parseVacancySearch(input)
  if (!isDatabaseConfigured()) {
    return searchDemoVacancies(query)
  }

  const db = useDatabase()
  const cursor = decodeVacancyCursor(query)
  const conditions = [
    publicVacancyConditions(),
  ]

  if (query.q) {
    conditions.push(or(sql<boolean>`
      to_tsvector(
        'english',
        ${schema.vacancies.title}
        || ' '
        || coalesce(${schema.vacancies.summary}, '')
        || ' '
        || ${schema.vacancies.description}
      ) @@ websearch_to_tsquery('english', ${query.q})
    `, sql<boolean>`to_tsvector('simple', ${schema.organisations.name}) @@ websearch_to_tsquery('simple', ${query.q})`,
    sql<boolean>`to_tsvector('simple', array_to_string(${schema.vacancies.skills}, ' ')) @@ websearch_to_tsquery('simple', ${query.q})`)!)
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
    conditions.push(salaryPresent())
  }
  if (query.salaryCurrency) conditions.push(eq(schema.vacancies.salaryCurrency, query.salaryCurrency))
  if (query.salaryPeriod) conditions.push(eq(schema.vacancies.salaryPeriod, query.salaryPeriod))
  if (query.sort === 'salary-desc') conditions.push(salaryPresent())

  const where = and(...conditions)
  return await db.transaction(async (tx) => {
    const rows = await tx
      .select({ ...vacancySelection, pageDate })
      .from(schema.vacancies)
      .innerJoin(
        schema.organisations,
        eq(schema.vacancies.organisationID, schema.organisations.id),
      )
      .where(and(where, cursor ? olderVacancies(query, cursor) : undefined))
      .orderBy(...vacancyOrder(query))
      .limit(query.limit + 1)
    const totals = await tx
      .select({ value: count() })
      .from(schema.vacancies)
      .innerJoin(
        schema.organisations,
        eq(schema.vacancies.organisationID, schema.organisations.id),
      )
      .where(where)
    const page = rows.slice(0, query.limit)
    const last = page.at(-1)
    const items = page.map(toVacancyListItem)
    return {
      items,
      total: totals[0]?.value ?? 0,
      dataStatus: items.every(item => item.source.status === 'VERIFIED')
        ? 'VERIFIED'
        : 'DEMO',
      nextCursor: rows.length > query.limit && last ? encodeVacancyCursor(query, { id: last.id, date: last.pageDate, salary: last.salaryMax }) : null,
    }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
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
      publicVacancyConditions(),
    ))
    .limit(1)

  return row ? toVacancyListItem(row) : undefined
}

const vacancySelection = {
  ...applicationContextSelection,
  talentbayPublishedAt: schema.vacancies.talentbayPublishedAt,
  sourcePublishedAt: schema.vacancies.sourcePublishedAt,
  sourceFetchedAt: schema.vacancies.sourceFetchedAt,
  lastImportedAt: schema.vacancies.lastImportedAt,
  reviewedAt: schema.vacancies.reviewedAt,
  reviewStatus: schema.vacancies.reviewStatus,
}

type VacancyRecord = typeof schema.vacancies.$inferSelect
type VacancyRow = ApplicationContextRow & Pick<
  VacancyRecord,
  | 'talentbayPublishedAt'
  | 'sourcePublishedAt'
  | 'sourceFetchedAt'
  | 'lastImportedAt'
  | 'reviewedAt'
  | 'reviewStatus'
>

function toVacancyListItem(row: VacancyRow): VacancyListItem {
  const sourceStatus: VacancyDataStatus = row.reviewStatus === 'VERIFIED'
    && row.sourceName !== 'TalentBay preview dataset'
    ? 'VERIFIED'
    : 'DEMO'

  return {
    id: row.id,
    applicationContext: sourceStatus === 'VERIFIED' ? applicationContextRevision(row) : undefined,
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
    publishedAt: row.talentbayPublishedAt?.toISOString() ?? null,
    provenance: {
      sourcePublishedAt: row.sourcePublishedAt?.toISOString() ?? null,
      sourceFetchedAt: row.sourceFetchedAt?.toISOString() ?? null,
      lastImportedAt: row.lastImportedAt?.toISOString() ?? null,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    },
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
