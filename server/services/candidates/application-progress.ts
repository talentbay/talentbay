import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import type { CandidateApplicationProgress } from '#shared/types/candidates'
import { handlingCloseReasons } from '#shared/types/application-handling'
import type { HandlingCloseReason } from '#shared/types/application-handling'

export async function candidateApplicationProgress(userID: number, id: number, before?: number): Promise<CandidateApplicationProgress> {
  return await useDatabase().transaction(async (db) => {
  const [application] = await db.select({ id: schema.applications.id, stage: schema.applications.handlingStage, hasSnapshot: sql<boolean>`${schema.applications.submissionSnapshot} is not null` })
    .from(schema.applications).where(and(eq(schema.applications.userID, userID), eq(schema.applications.id, id))).limit(1)
  if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  const conditions = [eq(schema.applicationHandlingEvents.applicationID, id), inArray(schema.applicationHandlingEvents.kind, ['RECEIVED', 'STARTED', 'CONTACTED', 'SHARED', 'FOLLOW_UP', 'CLOSED', 'WITHDRAWN'])]
  if (before) conditions.push(lt(schema.applicationHandlingEvents.revision, before))
  // Select only public fields: never fetch notes, actors, channel, reference or digest.
  const rows = await db.select({
    revision: schema.applicationHandlingEvents.revision, kind: schema.applicationHandlingEvents.kind,
    createdAt: schema.applicationHandlingEvents.createdAt,
    occurredAt: sql<string | null>`${schema.applicationHandlingEvents.data}->>'occurredAt'`,
    closeReason: sql<string | null>`${schema.applicationHandlingEvents.data}->>'closeReason'`,
  }).from(schema.applicationHandlingEvents).where(and(...conditions)).orderBy(desc(schema.applicationHandlingEvents.revision)).limit(26)
  const [handoff] = await db.select({ id: schema.applicationHandlingEvents.id }).from(schema.applicationHandlingEvents)
    .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.kind, 'SHARED'))).limit(1)
  const events: CandidateApplicationProgress['events'] = rows.slice(0, 25).filter(row => row.kind !== 'ASSIGNED').map(row => ({
    revision: row.revision, kind: row.kind as CandidateApplicationProgress['events'][number]['kind'],
    createdAt: row.createdAt.toISOString(), occurredAt: row.occurredAt,
    closeReason: handlingCloseReasons.includes(row.closeReason as HandlingCloseReason) ? row.closeReason as HandlingCloseReason : null,
  }))
    return { id, stage: application.stage, legacy: !application.hasSnapshot, handoffRecorded: Boolean(handoff), events, nextCursor: rows.length > 25 ? events.at(-1)!.revision : null }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}
