import { and, desc, eq, sql, lt, or, inArray, not } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'
import { captureApplicationSnapshot } from './application-snapshot'
import { applicationContextRevision, applicationContextSelection } from '#server/services/vacancies/application-context'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import { previewDatasetName } from '#server/services/vacancies/preview-dataset'
import type {
  CandidateApplicationHistoryItem,
  CandidateApplicationsResponse,
} from '#shared/types/candidates'

export const applicationInputSchema = z.object({
  coverLetter: z.string().trim().max(5_000).nullable().optional(),
  disclosureVersion: z.literal(applicationDisclosureVersion),
  shareAcknowledged: z.literal(true),
  expectedContext: z.string().regex(/^v1:[a-f0-9]{64}$/),
  expectedCandidateContext: z.string().length(67).regex(/^v1:[a-f0-9]{64}$/),
}).strict()

export type ApplicationInput = z.infer<typeof applicationInputSchema>

export const candidateApplicationQuery = z.object({
  status: z.enum(['all', 'active', 'closed']).optional(),
  before: z.coerce.number().int().positive().max(2147483647).optional(),
}).strict()

const closedApplication = or(inArray(schema.applications.status, ['REJECTED', 'WITHDRAWN']), eq(schema.applications.handlingStage, 'CLOSED'))!

export async function createApplication(
  userID: number,
  vacancyID: number,
  input: ApplicationInput,
) {
  const body = applicationInputSchema.parse(input)
  const db = useDatabase()
  return await db.transaction(async (tx) => {
    const [vacancy] = await tx
      .select({
        ...applicationContextSelection,
        vacancyRevision: schema.vacancies.updatedAt, organisationRevision: schema.organisations.updatedAt,
      })
      .from(schema.vacancies)
      .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
      .where(and(
        eq(schema.vacancies.id, vacancyID),
        publicVacancyConditions(),
        sql`${schema.vacancies.sourceName} is distinct from ${previewDatasetName}`,
      ))
      .limit(1)
      .for('share')

    if (!vacancy) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Published vacancy not found',
      })
    }

    if (applicationContextRevision(vacancy) !== body.expectedContext) {
      throw createError({ statusCode: 412, statusMessage: 'Review the changed vacancy before applying' })
    }

    // Read profile and account in the same transaction as the immutable receipt.
    const [user] = await tx.select().from(schema.users).where(eq(schema.users.id, userID)).for('share')
    if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })
    const [profile] = await tx.select().from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userID, userID)).for('share')
    const snapshot = captureApplicationSnapshot(
      { user, profile: profile ?? null }, body.expectedCandidateContext,
      { id: vacancy.id, slug: vacancy.slug, title: vacancy.title, city: vacancy.city, countryCode: vacancy.countryCode, sourceUrl: vacancy.sourceUrl, sourceExternalID: vacancy.sourceExternalID, revision: vacancy.vacancyRevision.toISOString(), contextRevision: body.expectedContext },
      { organisationID: vacancy.organisationID, name: vacancy.companyName, revision: vacancy.organisationRevision.toISOString() }, new Date(),
    )

    const [application] = await tx
      .insert(schema.applications)
      .values({
        userID,
        vacancyID,
        coverLetter: body.coverLetter || null,
        submissionSnapshot: snapshot,
        handlingRevision: 1,
        createdAt: new Date(snapshot.submittedAt),
      })
      .onConflictDoNothing()
      .returning({
        id: schema.applications.id,
        status: schema.applications.status,
        createdAt: schema.applications.createdAt,
      })

    if (!application) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You have already applied to this vacancy',
      })
    }

    await tx.insert(schema.applicationHandlingEvents).values({
      applicationID: application.id, revision: 1, kind: 'RECEIVED', stage: 'RECEIVED', actorUserID: userID, createdAt: new Date(snapshot.submittedAt),
    })

    return {
      ...application,
      createdAt: application.createdAt.toISOString(),
    }
  })
}

async function readCandidateHistory(
  userID: number,
  limit: number,
  ...conditions: SQL[]
): Promise<CandidateApplicationHistoryItem[]> {
  const rows = await useDatabase()
    .select({
      id: schema.applications.id,
      status: schema.applications.status,
      coverLetter: schema.applications.coverLetter,
      createdAt: schema.applications.createdAt,
      snapshot: schema.applications.submissionSnapshot,
      handling: { stage: schema.applications.handlingStage },
      publicVacancySlug: sql<string | null>`case when ${publicVacancyConditions()} then ${schema.vacancies.slug} end`,
    })
    .from(schema.applications)
    .innerJoin(
      schema.vacancies,
      eq(schema.applications.vacancyID, schema.vacancies.id),
    )
    .innerJoin(
      schema.organisations,
      eq(schema.vacancies.organisationID, schema.organisations.id),
    )
    .where(and(eq(schema.applications.userID, userID), ...conditions))
    .orderBy(desc(schema.applications.id)).limit(limit)

  return rows.map(row => ({
    id: row.id,
    status: row.status,
    coverLetter: row.coverLetter,
    createdAt: row.createdAt.toISOString(),
    handling: row.handling,
    publicVacancySlug: row.publicVacancySlug,
    vacancy: row.snapshot ? {
      slug: row.snapshot.vacancy.slug, title: row.snapshot.vacancy.title, companyName: row.snapshot.recipient.name,
      city: row.snapshot.vacancy.city, countryCode: row.snapshot.vacancy.countryCode,
    } : null,
  }))
}

export async function getCandidateApplication(userID: number, id: number): Promise<CandidateApplicationHistoryItem> {
  const [item] = await readCandidateHistory(userID, 1, eq(schema.applications.id, id))
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  return item
}

export async function listCandidateApplications(
  userID: number,
  filters: z.infer<typeof candidateApplicationQuery> = {},
): Promise<CandidateApplicationsResponse> {
  const conditions: SQL[] = []
  if (filters.before) conditions.push(lt(schema.applications.id, filters.before))
  if (filters.status === 'closed') conditions.push(closedApplication)
  if (filters.status === 'active') conditions.push(not(closedApplication))
  const owned = eq(schema.applications.userID, userID)
  const [counts] = await useDatabase().select({ all: sql<number>`count(*)::int`, closed: sql<number>`count(*) filter (where ${closedApplication})::int` }).from(schema.applications).where(owned)
  const rows = await readCandidateHistory(userID, 26, ...conditions)
  const items = rows.slice(0, 25)
  return {
    items,
    total: filters.status === 'active' ? counts!.all - counts!.closed : filters.status === 'closed' ? counts!.closed : counts!.all,
    nextCursor: rows.length > 25 ? items.at(-1)!.id : null,
    counts: { ...counts!, active: counts!.all - counts!.closed },
  }
}

export async function candidateApplicationForVacancy(userID: number, vacancyID: number) {
  const [application] = await useDatabase().select({ id: schema.applications.id, status: schema.applications.status }).from(schema.applications)
    .where(and(eq(schema.applications.userID, userID), eq(schema.applications.vacancyID, vacancyID))).limit(1)
  return { application: application || null }
}

export async function withdrawApplication(userID: number, id: number) {
  return await useDatabase().transaction(async (tx) => {
    const [row] = await tx.select().from(schema.applications)
      .where(and(eq(schema.applications.id, id), eq(schema.applications.userID, userID))).for('update')
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    if (row.status === 'WITHDRAWN') return { id: row.id, status: row.status }
    if (row.status === 'REJECTED') throw createError({ statusCode: 409, statusMessage: 'This application is already closed' })
    const revision = row.handlingRevision + 1
    const [updated] = await tx.update(schema.applications).set({ status: 'WITHDRAWN', handlingStage: 'CLOSED', handlingRevision: revision }).where(eq(schema.applications.id, id))
      .returning({ id: schema.applications.id, status: schema.applications.status })
    await tx.insert(schema.applicationHandlingEvents).values({
      applicationID: id, revision, kind: 'WITHDRAWN', stage: 'CLOSED', actorUserID: userID,
    })
    return updated!
  })
}
