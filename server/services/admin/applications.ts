import { and, count, desc, eq, lt, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { readHistoryEvidence } from '#server/services/applications/history-evidence'
import { getCandidateProfile } from '#server/services/candidates/profile'
import type { AdminApplicationDetail, AdminApplicationsResponse } from '#shared/types/application-review'
import { applicationQueueConditions, applicationQueueQuery } from './application-queue'
import { hasCandidateRequestedClosure } from './application-package'

export { applicationQueueQuery }

export async function listAdminApplications(filters: z.infer<typeof applicationQueueQuery>, actorID?: number): Promise<AdminApplicationsResponse> {
  const parsed = applicationQueueQuery.safeParse(filters)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid application filters' })
  filters = parsed.data
  const conditions = applicationQueueConditions(filters, actorID)
  return await useDatabase().transaction(async (tx) => {
    await tx.execute(sql`set local statement_timeout='5s'`)
    const rows = await tx.select({
      id: schema.applications.id, status: schema.applications.status, createdAt: schema.applications.createdAt,
      handling: { stage: schema.applications.handlingStage, revision: schema.applications.handlingRevision, assignedUserID: schema.applications.assignedUserID },
      candidate: { id: schema.users.id, name: schema.users.name },
      vacancy: { slug: schema.vacancies.slug, title: schema.vacancies.title, companyName: schema.organisations.name, city: schema.vacancies.city, countryCode: schema.vacancies.countryCode },
    }).from(schema.applications)
      .innerJoin(schema.users, eq(schema.applications.userID, schema.users.id))
      .innerJoin(schema.vacancies, eq(schema.applications.vacancyID, schema.vacancies.id))
      .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
      .where(and(conditions, filters.before ? lt(schema.applications.id, filters.before) : undefined)).orderBy(desc(schema.applications.id)).limit(26)
    const [total] = await tx.select({ value: count() }).from(schema.applications).where(conditions)
    const items = rows.slice(0, 25).map(row => ({ ...row, createdAt: row.createdAt.toISOString() }))
    return { items, total: total!.value, nextCursor: rows.length > 25 ? items.at(-1)!.id : null }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}

export async function getAdminApplication(id: number): Promise<AdminApplicationDetail> {
  return await useDatabase().transaction(async (tx) => {
    const [row] = await tx.select({
      id: schema.applications.id, status: schema.applications.status, coverLetter: schema.applications.coverLetter,
      createdAt: schema.applications.createdAt, userID: schema.applications.userID,
      submissionSnapshot: schema.applications.submissionSnapshot,
      handling: { stage: schema.applications.handlingStage, revision: schema.applications.handlingRevision, assignedUserID: schema.applications.assignedUserID },
      vacancy: { slug: schema.vacancies.slug, title: schema.vacancies.title, companyName: schema.organisations.name, city: schema.vacancies.city, countryCode: schema.vacancies.countryCode },
    }).from(schema.applications)
      .innerJoin(schema.vacancies, eq(schema.applications.vacancyID, schema.vacancies.id))
      .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
      .where(eq(schema.applications.id, id)).limit(1)
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    const { userID, ...application } = row
    const snapshot = row.submissionSnapshot
    const events = await tx.select({
      id: schema.applicationHandlingEvents.id, revision: schema.applicationHandlingEvents.revision,
      kind: schema.applicationHandlingEvents.kind, stage: schema.applicationHandlingEvents.stage,
      actorUserID: schema.applicationHandlingEvents.actorUserID, createdAt: schema.applicationHandlingEvents.createdAt,
      data: schema.applicationHandlingEvents.data, privateNote: schema.applicationHandlingEvents.privateNote,
    }).from(schema.applicationHandlingEvents).where(eq(schema.applicationHandlingEvents.applicationID, id)).orderBy(desc(schema.applicationHandlingEvents.revision)).limit(51)
    const evidence = await readHistoryEvidence(tx, id)
    return {
      ...application,
      createdAt: row.createdAt.toISOString(),
      events: events.slice(0, 50).map(event => ({ ...event, createdAt: event.createdAt.toISOString() })),
      eventsTruncated: events.length > 50,
      hasUncorrectedContact: evidence.firstUncorrectedContactRevision !== null,
      handoffRecorded: evidence.handoffRecorded,
      handoffCorrected: evidence.handoffCorrected,
      canReopenHandling: row.handling.stage === 'CLOSED' && !['WITHDRAWN', 'REJECTED'].includes(row.status) && !await hasCandidateRequestedClosure(tx, id),
      candidate: snapshot ? {
        user: { id: userID, name: snapshot.candidate.name, email: snapshot.candidate.email, avatarUrl: null },
        profile: snapshot.candidate.profile,
      } : await getCandidateProfile(userID, tx),
      vacancy: snapshot ? {
        ...row.vacancy, slug: snapshot.vacancy.slug, title: snapshot.vacancy.title, city: snapshot.vacancy.city, countryCode: snapshot.vacancy.countryCode, companyName: snapshot.recipient.name,
      } : row.vacancy,
    }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}

