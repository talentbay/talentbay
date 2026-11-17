import { and, eq, sql } from 'drizzle-orm'
import type { Database } from '#server/db'
import { schema } from '#server/db'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import { applicationContextRevision, applicationContextSelection } from '#server/services/vacancies/application-context'

export type ApplicationTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type ApplicationRow = typeof schema.applications.$inferSelect

export async function hasCandidateRequestedClosure(db: Pick<Database, 'select'>, id: number): Promise<boolean> {
  const [closure] = await db.select({ id: schema.applicationHandlingEvents.id }).from(schema.applicationHandlingEvents)
    .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.kind, 'CLOSED'), sql`${schema.applicationHandlingEvents.data}->>'closeReason' = 'CANDIDATE_REQUEST'`)).limit(1)
  return Boolean(closure)
}

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
  if (await hasCandidateRequestedClosure(tx, application.id)) throw createError({ statusCode: 409, statusMessage: 'Candidate-requested closure needs renewed permission; do not share this package' })
  const [current] = await tx.select({
    ...applicationContextSelection,
    vacancyRevision: schema.vacancies.updatedAt, organisationRevision: schema.organisations.updatedAt,
  }).from(schema.vacancies).innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
    .where(and(eq(schema.vacancies.id, application.vacancyID), publicVacancyConditions())).for('share')
  if (!current || current.id !== snapshot.vacancy.id || current.organisationID !== snapshot.recipient.organisationID
    || current.title !== snapshot.vacancy.title || current.companyName !== snapshot.recipient.name
    || (snapshot.vacancy.contextRevision
      ? applicationContextRevision(current) !== snapshot.vacancy.contextRevision
      : current.vacancyRevision.toISOString() !== snapshot.vacancy.revision || current.organisationRevision.toISOString() !== snapshot.recipient.revision)) {
    throw createError({ statusCode: 409, statusMessage: 'The vacancy or company changed; do not share this package' })
  }
  return snapshot
}
