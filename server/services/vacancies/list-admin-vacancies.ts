import { and, desc, eq } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'

type VacancyStatus = typeof schema.vacancies.$inferSelect.status
type ReviewStatus = typeof schema.vacancies.$inferSelect.reviewStatus

export type AdminVacancyFilters = {
  status?: VacancyStatus
  reviewStatus?: ReviewStatus
}

export async function listAdminVacancies(filters: AdminVacancyFilters) {
  const db = useDatabase()
  const conditions = []

  if (filters.status) {
    conditions.push(eq(schema.vacancies.status, filters.status))
  }

  if (filters.reviewStatus) {
    conditions.push(eq(schema.vacancies.reviewStatus, filters.reviewStatus))
  }

  return await db
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
    })
    .from(schema.vacancies)
    .innerJoin(
      schema.organisations,
      eq(schema.vacancies.organisationID, schema.organisations.id),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.vacancies.updatedAt))
    .limit(100)
}
