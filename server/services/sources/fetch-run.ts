import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { fetchLeverJobs } from './lever-fetch'
import { SourceFetchError } from './lever-contract'
import { approvedSourceSchema, sourceConfigRevision, sourceKey } from './registry'
import type { ApprovedSource } from './registry'
import { currentSourceOperator, emptyReport, lockSource, requireRun, sameRun, sourceProgress } from './run-state'

/** Claim and finish are short SQL transactions; provider I/O never holds a DB lock. */
export async function fetchSourceRun(input: ApprovedSource, runID: string, actorUserID: number, transport: typeof fetch = fetch) {
  const source = approvedSourceSchema.parse(input)
  runID = z.uuid().parse(runID)
  const key = sourceKey(source)
  const claimed = await useDatabase().transaction(async (tx) => {
    await currentSourceOperator(tx, actorUserID)
    const previous = await lockSource(tx, key)
    const now = new Date()
    if (previous?.runID === runID) return { claimed: false, row: requireRun(previous, source, runID) }
    if (previous?.retryAfterAt && previous.retryAfterAt > now) throw createError({ statusCode: 429, statusMessage: 'Source retry window has not elapsed' })
    if (previous && ['FETCHING', 'READY'].includes(previous.state) && previous.expiresAt > now) {
      throw createError({ statusCode: 409, statusMessage: 'Another source run is active. Resume it or wait for expiry.' })
    }
    const values = {
      sourceKey: key, runID, configRevision: sourceConfigRevision(source), state: 'FETCHING' as const,
      actorUserID, expiresAt: new Date(now.getTime() + 90_000), retryAfterAt: null, nextOffset: 0,
      items: null, previewRevision: null, lastCommitRevision: null, lastCommitOffset: null,
      report: emptyReport(), updatedAt: now,
    }
    const [row] = await tx.insert(schema.sourceImports).values(values).onConflictDoUpdate({ target: schema.sourceImports.sourceKey, set: values }).returning()
    return { claimed: true, row: row! }
  })
  if (!claimed.claimed) return sourceProgress(claimed.row)

  let result: Awaited<ReturnType<typeof fetchLeverJobs>> | undefined
  let failure: string | null = null
  let retryAfterSeconds: number | null = null
  try {
    result = await fetchLeverJobs(source.config, transport)
    if (result.issues.length) failure = 'INVALID_RECORDS'
    else if (Buffer.byteLength(JSON.stringify(result.items), 'utf8') > 2 * 1024 * 1024) failure = 'SNAPSHOT_LIMIT'
  } catch (error) {
    failure = error instanceof SourceFetchError ? error.code : 'FETCH_FAILED'
    retryAfterSeconds = error instanceof SourceFetchError && error.code === 'RATE_LIMIT' ? error.retryAfterSeconds || 60 : null
  }
  return await useDatabase().transaction(async (tx) => {
    await currentSourceOperator(tx, actorUserID)
    const row = requireRun(await lockSource(tx, key), source, runID)
    const now = new Date()
    if (row.state !== 'FETCHING' || row.expiresAt <= now) throw createError({ statusCode: 409, statusMessage: 'Source lease expired. Start a new run.' })
    const report = { ...emptyReport(), failure, fetchedAt: result?.fetchedAt ?? null, pageCount: result?.pageCount ?? 0, recordCount: result?.recordCount ?? 0, contactSkippedIds: result?.contactSkippedIds ?? [], mobilitySkippedIds: result?.mobilitySkippedIds ?? [], issues: result?.issues ?? [] }
    const [updated] = await tx.update(schema.sourceImports).set({
      state: failure ? 'FAILED' : result!.items.length ? 'READY' : 'IMPORTED',
      items: failure || !result!.items.length ? null : result!.items,
      expiresAt: new Date(now.getTime() + 30 * 60_000),
      retryAfterAt: retryAfterSeconds ? new Date(now.getTime() + retryAfterSeconds * 1000) : null,
      report, updatedAt: now,
    }).where(sameRun(key, runID)).returning()
    return sourceProgress(updated!)
  })
}
