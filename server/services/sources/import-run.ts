import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import { importVacanciesInTransaction, vacancyImportRequestSchema } from '#server/services/vacancies/import-vacancies'
import { prepareVacancyImport } from '#server/services/vacancies/import-preview'
import type { ApprovedSource } from './registry'
import { sourceKey } from './registry'
import { currentSourceOperator, lockSource, requireReady, requireRun, sameRun, sourceProgress } from './run-state'

const checkpointSchema = z.object({ runID: z.uuid(), offset: z.number().int().min(0).max(199), revision: z.string().regex(/^[a-f0-9]{64}$/) }).strict()

export async function previewSourceBatch(source: ApprovedSource, runID: string, actorUserID: number) {
  runID = z.uuid().parse(runID)
  return await useDatabase().transaction(async (tx) => {
    await currentSourceOperator(tx, actorUserID)
    // Keep the same order as commit/import: global import -> source -> company -> vacancy.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('talentbay:vacancy-import', 0))`)
    const key = sourceKey(source)
    const row = requireRun(await lockSource(tx, key), source, runID)
    requireReady(row, new Date())
    const items = vacancyImportRequestSchema.parse({ items: row.items!.slice(row.nextOffset, row.nextOffset + 50) }).items
    const preview = await prepareVacancyImport(items, tx, true)
    await tx.update(schema.sourceImports).set({ previewRevision: preview.revision, updatedAt: new Date() }).where(sameRun(key, runID))
    return { progress: sourceProgress(row), offset: row.nextOffset, preview }
  })
}

export async function importSourceBatch(source: ApprovedSource, checkpoint: z.infer<typeof checkpointSchema>, actorUserID: number) {
  const command = checkpointSchema.parse(checkpoint)
  return await useDatabase().transaction(async (tx) => {
    await currentSourceOperator(tx, actorUserID)
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('talentbay:vacancy-import', 0))`)
    const key = sourceKey(source)
    const row = requireRun(await lockSource(tx, key), source, command.runID)
    // Retry after a committed but lost response does not import or count the batch twice.
    if (row.lastCommitOffset === command.offset && row.lastCommitRevision === command.revision) return sourceProgress(row)
    requireReady(row, new Date())
    if (row.nextOffset !== command.offset || row.previewRevision !== command.revision) throw createError({ statusCode: 409, statusMessage: 'Source checkpoint changed. Preview the next batch again.' })
    const items = row.items!.slice(row.nextOffset, row.nextOffset + 50)
    const results = await importVacanciesInTransaction(tx, items, { expectedRevision: command.revision, actorUserID, sourceFetchedAt: row.report.fetchedAt ? new Date(row.report.fetchedAt) : undefined })
    const nextOffset = row.nextOffset + results.length
    const complete = nextOffset >= row.items!.length
    const report = { ...row.report }
    for (const result of results) {
      if (result.operation === 'CREATED') report.created++
      else if (result.operation === 'UPDATED') report.updated++
      else report.unchanged++
    }
    const [updated] = await tx.update(schema.sourceImports).set({
      nextOffset, report, state: complete ? 'IMPORTED' : 'READY', items: complete ? null : row.items,
      previewRevision: null, lastCommitRevision: command.revision, lastCommitOffset: command.offset, updatedAt: new Date(),
    }).where(sameRun(key, command.runID)).returning()
    return sourceProgress(updated!)
  })
}

export async function getSourceProgress(source: ApprovedSource, actorUserID: number) {
  return await useDatabase().transaction(async (tx) => {
    await currentSourceOperator(tx, actorUserID)
    const row = await lockSource(tx, sourceKey(source))
    if (!row) return null
    requireRun(row, source, row.runID)
    if ((row.state === 'FETCHING' || row.state === 'READY') && row.expiresAt <= new Date() && row.items) {
      await tx.update(schema.sourceImports).set({ items: null, previewRevision: null }).where(sameRun(row.sourceKey, row.runID))
    }
    return sourceProgress(row)
  })
}
