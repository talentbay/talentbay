import { and, eq } from 'drizzle-orm'
import type { Database } from '#server/db'
import { schema } from '#server/db'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'
import { applicationDisclosureVersion } from '#shared/types/application-handling'

export type ApplicationTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type ApplicationRow = typeof schema.applications.$inferSelect

export async function requireCurrentOperator(tx: ApplicationTransaction, id: number) {
  const [operator] = await tx.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, id)).for('share')
  if (operator?.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Current operator access required' })
}

export async function requireShareableSnapshot(tx: ApplicationTransaction, application: ApplicationRow) {
  const snapshot = application.submissionSnapshot
  if (!snapshot || snapshot.version !== 1 || snapshot.disclosureVersion !== applicationDisclosureVersion || !snapshot.vacancy.revision || !snapshot.recipient.revision) {
    throw createError({ statusCode: 409, statusMessage: 'This application has no eligible submission snapshot' })
  }
  if (application.status === 'WITHDRAWN' || application.status === 'REJECTED' || application.handlingStage === 'CLOSED') {
    throw createError({ statusCode: 409, statusMessage: 'This application is closed' })
  }
  const [current] = await tx.select({
    id: schema.vacancies.id, organisationID: schema.organisations.id,
    title: schema.vacancies.title, companyName: schema.organisations.name,
    vacancyRevision: schema.vacancies.updatedAt, organisationRevision: schema.organisations.updatedAt,
  }).from(schema.vacancies).innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
    .where(and(eq(schema.vacancies.id, application.vacancyID), publicVacancyConditions())).for('share')
  if (!current || current.id !== snapshot.vacancy.id || current.organisationID !== snapshot.recipient.organisationID
    || current.title !== snapshot.vacancy.title || current.companyName !== snapshot.recipient.name
    || current.vacancyRevision.toISOString() !== snapshot.vacancy.revision || current.organisationRevision.toISOString() !== snapshot.recipient.revision) {
    throw createError({ statusCode: 409, statusMessage: 'The vacancy or company changed; do not share this package' })
  }
  return snapshot
}
