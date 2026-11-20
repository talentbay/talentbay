import { and, eq, exists, gt, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { schema } from '#server/db'
import type { Database } from '#server/db'

const events = schema.applicationHandlingEvents
const correction = alias(events, 'history_correction')
const correctsEvent = and(
  eq(correction.applicationID, events.applicationID), eq(correction.kind, 'CORRECTED'),
  gt(correction.revision, events.revision),
  sql`${correction.data}->>'correctedRevision' = cast(${events.revision} as text)`,
)

export function eventWasCorrected(db: Pick<Database, 'select'>) {
  return sql<boolean>`${exists(db.select({ id: correction.id }).from(correction).where(correctsEvent))}`
}

export async function readHistoryEvidence(db: Pick<Database, 'select'>, applicationID: number) {
  // The earliest surviving contact supports only closures recorded after it.
  const [evidence] = await db.select({
    firstUncorrectedContactRevision: sql<number | null>`min(${events.revision}) filter (where ${events.kind} = 'CONTACTED' and ${correction.id} is null)`,
    handoffRecorded: sql<boolean>`count(*) filter (where ${events.kind} = 'SHARED') > 0`,
    handoffCorrected: sql<boolean>`count(*) filter (where ${events.kind} = 'SHARED' and ${correction.id} is not null) > 0`,
  }).from(events).leftJoin(correction, correctsEvent)
    .where(and(eq(events.applicationID, applicationID), inArray(events.kind, ['CONTACTED', 'SHARED'])))
  return evidence!
}
