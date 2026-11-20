import { and, eq, sql } from 'drizzle-orm'
import { schema } from '#server/db'
import type { ImportTransaction } from '#server/services/vacancies/import-vacancies'
import type { SourceRunProgress, SourceRunReport } from '#shared/types/source-import'
import { approvedSourceSchema, sourceConfigRevision, sourceKey } from './registry'
import type { ApprovedSource } from './registry'

export type SourceRun = typeof schema.sourceImports.$inferSelect
export const emptyReport = (): SourceRunReport => ({ fetchedAt: null, pageCount: 0, recordCount: 0, contactSkippedIds: [], created: 0, updated: 0, unchanged: 0, failure: null, issues: [] })

export async function currentSourceOperator(tx: ImportTransaction, id: number) {
  await tx.execute(sql`set local lock_timeout = '5s'`)
  await tx.execute(sql`set local statement_timeout = '15s'`)
  const [user] = await tx.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, id)).for('share')
  if (user?.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Current operator access required' })
}

export async function lockSource(tx: ImportTransaction, key: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'talentbay:source:' + key}, 0))`)
  const [row] = await tx.select().from(schema.sourceImports).where(eq(schema.sourceImports.sourceKey, key)).for('update')
  return row
}

export function requireRun(row: SourceRun | undefined, source: ApprovedSource, runID: string): SourceRun {
  approvedSourceSchema.parse(source)
  if (!row || row.sourceKey !== sourceKey(source) || row.runID !== runID || row.configRevision !== sourceConfigRevision(source)) {
    throw createError({ statusCode: 409, statusMessage: 'Source configuration or run changed. Reload source progress.' })
  }
  return row
}
export function requireReady(row: SourceRun, now: Date) {
  if (row.state !== 'READY' || row.expiresAt <= now || !row.items) throw createError({ statusCode: 409, statusMessage: 'Source snapshot expired or is not ready. Start a new run.' })
}
export function sourceProgress(row: SourceRun, now = new Date()): SourceRunProgress {
  return {
    sourceKey: row.sourceKey, runID: row.runID,
    state: (row.state === 'FETCHING' || row.state === 'READY') && row.expiresAt <= now ? 'EXPIRED' : row.state,
    nextOffset: row.nextOffset, expiresAt: row.expiresAt.toISOString(), retryAfterAt: row.retryAfterAt?.toISOString() ?? null,
    report: row.report,
  }
}
export const sameRun = (key: string, runID: string) => and(eq(schema.sourceImports.sourceKey, key), eq(schema.sourceImports.runID, runID))
