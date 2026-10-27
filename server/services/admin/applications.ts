import { and, desc, eq, lt } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { getCandidateProfile } from '#server/services/candidates/profile'
import type { AdminApplicationDetail, AdminApplicationsResponse } from '#shared/types/application-review'
import { handlingStages } from '#shared/types/application-handling'

export const applicationQueueQuery = z.object({
  status: z.enum(schema.applicationStatusEnum.enumValues).optional(),
  before: z.coerce.number().int().positive().max(2147483647).optional(),
  stage: z.enum(handlingStages).optional(),
  assignee: z.literal('mine').optional(),
})

export async function listAdminApplications(filters: z.infer<typeof applicationQueueQuery>, actorID?: number): Promise<AdminApplicationsResponse> {
  const conditions = []
  if (filters.status) conditions.push(eq(schema.applications.status, filters.status))
  if (filters.before) conditions.push(lt(schema.applications.id, filters.before))
  if (filters.stage) conditions.push(eq(schema.applications.handlingStage, filters.stage))
  if (filters.assignee === 'mine') {
    if (!actorID) throw createError({ statusCode: 403, statusMessage: 'Current operator required' })
    conditions.push(eq(schema.applications.assignedUserID, actorID))
  }
  const rows = await useDatabase().select({
    id: schema.applications.id, status: schema.applications.status, createdAt: schema.applications.createdAt,
    handling: { stage: schema.applications.handlingStage, revision: schema.applications.handlingRevision, assignedUserID: schema.applications.assignedUserID },
    candidate: { id: schema.users.id, name: schema.users.name },
    vacancy: { slug: schema.vacancies.slug, title: schema.vacancies.title, companyName: schema.organisations.name, city: schema.vacancies.city, countryCode: schema.vacancies.countryCode },
  }).from(schema.applications)
    .innerJoin(schema.users, eq(schema.applications.userID, schema.users.id))
    .innerJoin(schema.vacancies, eq(schema.applications.vacancyID, schema.vacancies.id))
    .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
    .where(and(...conditions)).orderBy(desc(schema.applications.id)).limit(26)
  const items = rows.slice(0, 25).map(row => ({ ...row, createdAt: row.createdAt.toISOString() }))
  return { items, nextCursor: rows.length > 25 ? items.at(-1)!.id : null }
}

export async function getAdminApplication(id: number): Promise<AdminApplicationDetail> {
  const [row] = await useDatabase().select({
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
  const events = await useDatabase().select({
    id: schema.applicationHandlingEvents.id, revision: schema.applicationHandlingEvents.revision,
    kind: schema.applicationHandlingEvents.kind, stage: schema.applicationHandlingEvents.stage,
    actorUserID: schema.applicationHandlingEvents.actorUserID, createdAt: schema.applicationHandlingEvents.createdAt,
    data: schema.applicationHandlingEvents.data, privateNote: schema.applicationHandlingEvents.privateNote,
  }).from(schema.applicationHandlingEvents).where(eq(schema.applicationHandlingEvents.applicationID, id)).orderBy(desc(schema.applicationHandlingEvents.revision)).limit(51)
  const [handoff] = await useDatabase().select({ id: schema.applicationHandlingEvents.id }).from(schema.applicationHandlingEvents)
    .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.kind, 'SHARED'))).limit(1)
  return {
    ...application,
    createdAt: row.createdAt.toISOString(),
    events: events.slice(0, 50).map(event => ({ ...event, createdAt: event.createdAt.toISOString() })),
    eventsTruncated: events.length > 50,
    handoffRecorded: Boolean(handoff),
    candidate: snapshot ? {
      user: { id: userID, name: snapshot.candidate.name, email: snapshot.candidate.email, avatarUrl: null },
      profile: snapshot.candidate.profile,
    } : await getCandidateProfile(userID),
    vacancy: snapshot ? {
      ...row.vacancy, slug: snapshot.vacancy.slug, title: snapshot.vacancy.title, city: snapshot.vacancy.city, countryCode: snapshot.vacancy.countryCode, companyName: snapshot.recipient.name,
    } : row.vacancy,
  }
}

