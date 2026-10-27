import { and, desc, eq, exists, inArray, lt, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { schema, useDatabase } from '#server/db'
import type { CandidateApplicationProgress } from '#shared/types/candidates'
import { handlingCloseReasons, handlingCorrectionReasons } from '#shared/types/application-handling'
import type { HandlingCloseReason, HandlingCorrectionReason } from '#shared/types/application-handling'

export async function candidateApplicationProgress(userID: number, id: number, before?: number): Promise<CandidateApplicationProgress> {
  return await useDatabase().transaction(async (db) => {
  const [application] = await db.select({ id: schema.applications.id, stage: schema.applications.handlingStage, hasSnapshot: sql<boolean>`${schema.applications.submissionSnapshot} is not null` })
    .from(schema.applications).where(and(eq(schema.applications.userID, userID), eq(schema.applications.id, id))).limit(1)
  if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  const conditions = [eq(schema.applicationHandlingEvents.applicationID, id), inArray(schema.applicationHandlingEvents.kind, ['RECEIVED', 'STARTED', 'CONTACTED', 'SHARED', 'FOLLOW_UP', 'CLOSED', 'WITHDRAWN', 'CORRECTED', 'REOPENED'])]
  if (before) conditions.push(lt(schema.applicationHandlingEvents.revision, before))
  // Select only public fields: never fetch notes, actors, channel, reference or digest.
  const corrections = alias(schema.applicationHandlingEvents, 'corrections')
  const rows = await db.select({
    revision: schema.applicationHandlingEvents.revision, kind: schema.applicationHandlingEvents.kind,
    createdAt: schema.applicationHandlingEvents.createdAt,
    occurredAt: sql<string | null>`${schema.applicationHandlingEvents.data}->>'occurredAt'`,
    closeReason: sql<string | null>`${schema.applicationHandlingEvents.data}->>'closeReason'`,
    correctedRevision: sql<string | null>`${schema.applicationHandlingEvents.data}->>'correctedRevision'`,
    correctionReason: sql<string | null>`${schema.applicationHandlingEvents.data}->>'correctionReason'`,
    corrected: sql<boolean>`${exists(db.select({ id: corrections.id }).from(corrections).where(and(
      eq(corrections.applicationID, schema.applicationHandlingEvents.applicationID), eq(corrections.kind, 'CORRECTED'),
      sql`${corrections.data}->>'correctedRevision' = cast(${schema.applicationHandlingEvents.revision} as text)`,
    )))}`,
  }).from(schema.applicationHandlingEvents).where(and(...conditions)).orderBy(desc(schema.applicationHandlingEvents.revision)).limit(26)
  const [handoff] = await db.select({ id: schema.applicationHandlingEvents.id }).from(schema.applicationHandlingEvents)
    .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.kind, 'SHARED'))).limit(1)
  const events: CandidateApplicationProgress['events'] = rows.slice(0, 25).filter(row => row.kind !== 'ASSIGNED').map(row => ({
    revision: row.revision, kind: row.kind as CandidateApplicationProgress['events'][number]['kind'],
    createdAt: row.createdAt.toISOString(), occurredAt: row.occurredAt,
    closeReason: handlingCloseReasons.includes(row.closeReason as HandlingCloseReason) ? row.closeReason as HandlingCloseReason : null,
    corrected: row.corrected,
    correctedRevision: row.correctedRevision && /^[1-9]\d{0,9}$/.test(row.correctedRevision) && Number(row.correctedRevision) <= 2147483646 ? Number(row.correctedRevision) : null,
    correctionReason: handlingCorrectionReasons.includes(row.correctionReason as HandlingCorrectionReason) ? row.correctionReason as HandlingCorrectionReason : null,
  }))
    return { id, stage: application.stage, legacy: !application.hasSnapshot, handoffRecorded: Boolean(handoff), events, nextCursor: rows.length > 25 ? events.at(-1)!.revision : null }
  }, { isolationLevel: 'repeatable read', accessMode: 'read only' })
}
