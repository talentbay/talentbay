import { and, asc, count, eq, gte, isNotNull, lt, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'
import type { AdminDashboard } from '#shared/types/admin-dashboard'
import { activeApplicationWork, applicationNeedsOwner, effectiveHandlingEvent } from './application-queue'

export const dashboardQuery = z.object({ days: z.enum(['7', '30', '90']).default('30') }).strict()

export async function getAdminDashboard(input: z.input<typeof dashboardQuery> = {}, actorID?: number): Promise<AdminDashboard> {
  const parsed = dashboardQuery.safeParse(input)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid dashboard period' })
  const days = Number(parsed.data.days) as 7 | 30 | 90
  return await useDatabase().transaction(async (tx) => {
    await tx.execute(sql`set local statement_timeout='5s'`)
    const [clock] = await tx.select({ value: sql<string>`to_char(transaction_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')` }).from(sql`(values (1)) as clock`)
    const asOf = clock!.value
    const from = new Date(Date.parse(asOf) - days * 86_400_000).toISOString()
    const window = { days, from, before: asOf }
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
    const handlingStages = await tx.select({ stage: schema.applications.handlingStage, count: count() })
      .from(schema.applications).groupBy(schema.applications.handlingStage)
    const active = activeApplicationWork()
    const awaiting = and(active, eq(schema.applications.handlingStage, 'RECEIVED'))!
    const [work] = await tx.select({
      awaitingStart: sql<number>`count(*) filter (where ${awaiting})::integer`,
      inProgress: sql<number>`count(*) filter (where ${and(active, ne(schema.applications.handlingStage, 'RECEIVED'))})::integer`,
      needsOwner: sql<number>`count(*) filter (where ${and(active, applicationNeedsOwner())})::integer`,
      mine: sql<number>`count(*) filter (where ${and(active, eq(schema.applications.assignedUserID, actorID ?? -1))})::integer`,
    }).from(schema.applications)
    const cohort = and(gte(schema.applications.createdAt, new Date(from)), lt(schema.applications.createdAt, new Date(asOf)))!
    const [received] = await tx.select({ value: count() }).from(schema.applications).where(cohort)

    // Count applications, not attempts/retries. A correction invalidates the targeted fact only.
    const event = schema.applicationHandlingEvents
    const [activity] = await tx.select({
      contactRecorded: sql<number>`count(distinct ${event.applicationID}) filter (where ${event.kind} = 'CONTACTED')::integer`,
      handoffRecorded: sql<number>`count(distinct ${event.applicationID}) filter (where ${event.kind} = 'SHARED')::integer`,
    }).from(event).where(and(gte(event.createdAt, new Date(from)), lt(event.createdAt, new Date(asOf)), effectiveHandlingEvent()))
    const started = tx.select({ applicationID: event.applicationID, at: sql<Date>`min(${event.createdAt})`.as('first_started_at') })
      .from(event).where(eq(event.kind, 'STARTED')).groupBy(event.applicationID).as('first_start')
    const [firstStart] = await tx.select({
      samples: count(),
      averageSeconds: sql<number | null>`avg(extract(epoch from (${started.at} - ${schema.applications.createdAt})))::double precision`,
    }).from(schema.applications).innerJoin(started, eq(started.applicationID, schema.applications.id))
      .where(and(cohort, isNotNull(schema.applications.submissionSnapshot), sql`${started.at} >= ${schema.applications.createdAt}`, sql`${started.at} < ${asOf}::timestamptz`))
    const oldest = await tx.select({
      id: schema.applications.id, title: schema.vacancies.title, companyName: schema.organisations.name,
      receivedAt: schema.applications.createdAt,
      ageSeconds: sql<number>`greatest(0, extract(epoch from (${asOf}::timestamptz - ${schema.applications.createdAt})))::double precision`,
    }).from(schema.applications).innerJoin(schema.vacancies, eq(schema.vacancies.id, schema.applications.vacancyID))
      .innerJoin(schema.organisations, eq(schema.organisations.id, schema.vacancies.organisationID))
      .where(awaiting).orderBy(asc(schema.applications.createdAt), asc(schema.applications.id)).limit(5)
    return {
      asOf, window,
      users: accounts!.value, profiles: profiles!.value, organisations: companies!.value,
      vacancies: { ...vacancies!, published: visible!.value },
      applications: applicationStatuses.reduce((total, row) => total + row.count, 0), applicationStatuses,
      work: work!, handlingStages, activity: { received: received!.value, ...activity! },
      firstStart: firstStart!, oldest: oldest.map(row => ({ ...row, receivedAt: row.receivedAt.toISOString() })),
    }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}
