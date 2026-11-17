import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { and, asc, eq, or, sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import type { Database } from '#server/db'
import { relocationDatasetCoverage, relocationDatasetSchema } from './dataset-contract'
import type { RelocationDataset } from './dataset-contract'
import { datasetValues, sameDatasetValues } from './dataset-values'

type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export class DatasetImportError extends Error {
  constructor(public readonly code: 'INPUT' | 'ACCESS' | 'CONFLICT', public readonly issues: { path: string; code: string }[] = []) { super(`Relocation dataset ${code.toLowerCase()}`); this.name = 'DatasetImportError' }
}
export function validateRelocationDataset(input: unknown, now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new DatasetImportError('INPUT')
  const parsed = relocationDatasetSchema.safeParse(input)
  if (!parsed.success) throw new DatasetImportError('INPUT', parsed.error.issues.slice(0, 20).map(issue => ({ path: issue.path.map(String).join('.').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 160), code: issue.code })))
  if (parsed.data.records.some(record => record.review && Date.parse(record.review.at) > now.getTime())) throw new DatasetImportError('INPUT')
  const coverage = relocationDatasetCoverage(parsed.data, now.toISOString().slice(0, 10))
  if (parsed.data.records.some(record => record.status === 'VERIFIED' && coverage.find(city => city.key === record.destination)!.status !== 'VERIFIED')) throw new DatasetImportError('INPUT')
  return parsed.data
}
async function requireOperator(tx: Transaction, actorID: number, lock: boolean) {
  if (!Number.isInteger(actorID) || actorID <= 0) throw new DatasetImportError('ACCESS')
  const query = tx.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, actorID))
  const [actor] = await (lock ? query.for('share') : query)
  if (actor?.role !== 'ADMIN') throw new DatasetImportError('ACCESS')
}
async function planDataset(tx: Transaction, dataset: RelocationDataset, now: Date, lock: boolean) {
  const values = dataset.records.map(record => datasetValues(dataset.purpose, record))
  const query = tx.select().from(schema.relocationLocations)
    .where(or(...values.map(value => and(eq(schema.relocationLocations.countryCode, value.countryCode), sql`lower(btrim(${schema.relocationLocations.city})) = ${value.city.toLowerCase()}`))))
    .orderBy(asc(schema.relocationLocations.id)).limit(23)
  const candidates = await (lock ? query.for('update') : query)
  const rows = values.map((value, index) => {
    const matches = candidates.filter(row => row.countryCode === value.countryCode && row.city.trim().toLowerCase() === value.city.toLowerCase())
    if (matches.length > 1 || (matches[0] && matches[0].city !== value.city)) throw new DatasetImportError('CONFLICT')
    const current = matches[0]
    const previousReview = current?.datasetSnapshot?.record?.review
    if (value.status === 'VERIFIED' && previousReview) {
      const { review: _oldReview, status: _oldStatus, ...before } = current!.datasetSnapshot!.record
      const { review: _review, status: _status, ...after } = dataset.records[index]!
      const review = dataset.records[index]!.review!
      const changedContent = !isDeepStrictEqual(before, after) || current!.status === 'STALE'
      const previousTime = Date.parse(previousReview.at)
      const reviewTime = Date.parse(review.at)
      if (changedContent && (reviewTime < previousTime || (reviewTime === previousTime && review.reference === previousReview.reference))) throw new DatasetImportError('INPUT', [{ path: `records.${index}.review`, code: 'new_review_required' }])
    }
    const operation = !current ? 'CREATED' : sameDatasetValues(current, value) ? 'UNCHANGED' : 'UPDATED'
    return { destination: dataset.records[index]!.destination, id: current?.id ?? null, operation, value, current }
  })
  const revision = createHash('sha256').update(JSON.stringify({ dataset, today: now.toISOString().slice(0, 10), existing: rows.map(row => row.current ?? null) })).digest('hex')
  return {
    rows, revision,
    summary: { created: rows.filter(row => row.operation === 'CREATED').length, updated: rows.filter(row => row.operation === 'UPDATED').length, unchanged: rows.filter(row => row.operation === 'UNCHANGED').length, published: rows.filter(row => row.value.status === 'VERIFIED' && row.current?.status !== 'VERIFIED').length, withdrawn: rows.filter(row => row.current?.status === 'VERIFIED' && row.value.status !== 'VERIFIED').length },
    coverage: relocationDatasetCoverage(dataset, now.toISOString().slice(0, 10)),
  }
}
function publicPlan(plan: Awaited<ReturnType<typeof planDataset>>) {
  return { revision: plan.revision, summary: plan.summary, coverage: plan.coverage, rows: plan.rows.map(({ destination, id, operation }) => ({ destination, id, operation })) }
}
export async function previewRelocationDataset(input: unknown, actorID: number, now = new Date()) {
  const dataset = validateRelocationDataset(input, now)
  return await useDatabase().transaction(async (tx) => {
    await requireOperator(tx, actorID, false)
    return publicPlan(await planDataset(tx, dataset, now, false))
  }, { accessMode: 'read only', isolationLevel: 'repeatable read' })
}
export async function importRelocationDataset(input: unknown, actorID: number, revision: string, now = new Date()) {
  if (!/^[a-f0-9]{64}$/.test(revision)) throw new DatasetImportError('INPUT')
  const dataset = validateRelocationDataset(input, now)
  return await useDatabase().transaction(async (tx) => {
    await tx.execute(sql`set local lock_timeout = '5s'`)
    await tx.execute(sql`set local statement_timeout = '15s'`)
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('talentbay:relocation-import', 0))`)
    await requireOperator(tx, actorID, true)
    const plan = await planDataset(tx, dataset, now, true)
    if (plan.revision !== revision && plan.summary.unchanged !== dataset.records.length) throw new DatasetImportError('CONFLICT')
    const results = []
    for (const row of plan.rows) {
      if (row.operation === 'UNCHANGED') { results.push({ id: row.id!, destination: row.destination, operation: row.operation }); continue }
      const values = { ...row.value, importedAt: now, importedByUserID: actorID, updatedAt: now }
      const [saved] = row.id === null
        ? await tx.insert(schema.relocationLocations).values(values).returning({ id: schema.relocationLocations.id })
        : await tx.update(schema.relocationLocations).set(values).where(and(eq(schema.relocationLocations.id, row.id), eq(schema.relocationLocations.countryCode, row.value.countryCode))).returning({ id: schema.relocationLocations.id })
      if (!saved) throw new DatasetImportError('CONFLICT')
      results.push({ id: saved.id, destination: row.destination, operation: row.operation })
    }
    return { summary: plan.summary, coverage: plan.coverage, rows: results }
  })
}
