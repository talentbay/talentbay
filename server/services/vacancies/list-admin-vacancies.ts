import { and, count, desc, eq, ilike, lt, or, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import type { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { adminVacanciesQuery, containsText, readAdminCursor, writeAdminCursor } from '#server/services/admin/list-page'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'

export type AdminVacancyFilters = z.input<typeof adminVacanciesQuery>

export async function listAdminVacancies(input: AdminVacancyFilters) {
  const parsed = adminVacanciesQuery.safeParse(input)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy queue query' })
  const filters = parsed.data
  const cursor = readAdminCursor('vacancies', filters)
  const db = useDatabase()
  const conditions: (SQL | undefined)[] = []
  if (filters.publicOnly) conditions.push(publicVacancyConditions())

  if (filters.status) {
    conditions.push(eq(schema.vacancies.status, filters.status))
  }

  if (filters.reviewStatus) {
    conditions.push(eq(schema.vacancies.reviewStatus, filters.reviewStatus))
  }
  if (filters.q) {
    const search = containsText(filters.q)
    conditions.push(or(eq(schema.vacancies.sourceExternalID, filters.q), ilike(schema.vacancies.title, search), ilike(schema.organisations.name, search), ilike(schema.vacancies.sourceName, search))!)
  }
  const before = cursor ? or(
    sql`${schema.vacancies.updatedAt} < ${cursor.date}::timestamptz`,
    and(sql`${schema.vacancies.updatedAt} = ${cursor.date}::timestamptz`, lt(schema.vacancies.id, cursor.id)),
  ) : undefined

  return await db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: schema.vacancies.id,
        slug: schema.vacancies.slug,
        title: schema.vacancies.title,
        companyName: schema.organisations.name,
        city: schema.vacancies.city,
        countryCode: schema.vacancies.countryCode,
        status: schema.vacancies.status,
        reviewStatus: schema.vacancies.reviewStatus,
        sourceName: schema.vacancies.sourceName,
        sourceUrl: schema.vacancies.sourceUrl,
        updatedAt: schema.vacancies.updatedAt,
        pageDate: sql<string>`to_char(${schema.vacancies.updatedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
      })
      .from(schema.vacancies)
      .innerJoin(
        schema.organisations,
        eq(schema.vacancies.organisationID, schema.organisations.id),
      )
      .where(and(...conditions, before))
      .orderBy(desc(schema.vacancies.updatedAt), desc(schema.vacancies.id))
      .limit(filters.limit + 1)
    const [total] = await tx.select({ count: count() }).from(schema.vacancies)
      .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id)).where(and(...conditions))
    const page = rows.slice(0, filters.limit)
    const last = page.at(-1)
    return {
      items: page.map(({ pageDate: _pageDate, ...vacancy }) => vacancy),
      total: total?.count ?? 0,
      nextCursor: rows.length > filters.limit && last ? writeAdminCursor('vacancies', filters, { id: last.id, date: last.pageDate }) : null,
    }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}
