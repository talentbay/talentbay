import { count, eq, sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'

export async function getAdminDashboard() {
  return await useDatabase().transaction(async (tx) => {
    const [accounts] = await tx.select({ value: count() }).from(schema.users)
    const [profiles] = await tx.select({ value: count() }).from(schema.candidateProfiles)
    const [companies] = await tx.select({ value: count() }).from(schema.organisations)
    const [vacancies] = await tx.select({
      total: count(),
      unreviewed: sql<number>`count(*) filter (where ${schema.vacancies.reviewStatus} = 'UNREVIEWED')::integer`,
      flagged: sql<number>`count(*) filter (where ${schema.vacancies.reviewStatus} = 'FLAGGED')::integer`,
    }).from(schema.vacancies)
    const [visible] = await tx.select({ value: count() }).from(schema.vacancies)
      .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id)).where(publicVacancyConditions())
    const applicationStatuses = await tx.select({ status: schema.applications.status, count: count() })
      .from(schema.applications).groupBy(schema.applications.status)
    return {
      users: accounts!.value, profiles: profiles!.value, organisations: companies!.value,
      vacancies: { ...vacancies!, published: visible!.value },
      applications: applicationStatuses.reduce((total, row) => total + row.count, 0), applicationStatuses,
    }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}
