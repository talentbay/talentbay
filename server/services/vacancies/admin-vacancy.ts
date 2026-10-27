import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import { reviewedVacancyState } from './import-content'

export function vacancyRevision(vacancy: typeof schema.vacancies.$inferSelect, company: typeof schema.organisations.$inferSelect) {
  return createHash('sha256').update(JSON.stringify({ vacancy: reviewedVacancyState(vacancy), company })).digest('hex')
}

export async function getAdminVacancy(id: number) {
  const [record] = await useDatabase().select({ vacancy: schema.vacancies, company: schema.organisations, reviewer: { id: schema.users.id, name: schema.users.name } })
    .from(schema.vacancies).innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
    .leftJoin(schema.users, eq(schema.vacancies.reviewedByUserID, schema.users.id))
    .where(eq(schema.vacancies.id, id)).limit(1)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
  return { ...record, revision: vacancyRevision(record.vacancy, record.company) }
}
