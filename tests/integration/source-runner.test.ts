import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { fetchSourceRun } from '#server/services/sources/fetch-run'
import { getSourceProgress, importSourceBatch, previewSourceBatch } from '#server/services/sources/import-run'
import { approvedSourceSchema, sourceKey } from '#server/services/sources/registry'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const site = `runner-${randomUUID()}`
const source = approvedSourceSchema.parse({
  adapter: 'LEVER', config: { site, region: 'GLOBAL', company: { name: 'Fictional Runner Company', slug: site } },
  approval: { reference: 'local synthetic fixture only, not real approval', contentOwner: 'Fictional Test Operator', approvedAt: '2026-10-27T00:00:00Z' },
})
const key = sourceKey(source)
const raw = (id = randomUUID()) => ({ id, text: 'Fictional Runner Engineer', country: 'GB', workplaceType: 'remote', categories: { commitment: 'Full-time' }, descriptionPlain: 'A complete fictional role used to exercise durable import checkpoints.', hostedUrl: `https://jobs.lever.co/${site}/${id}` })
const json = (data: unknown) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } })
const transportFor = (records: unknown[]) => vi.fn<typeof fetch>().mockImplementation(async (url) => {
  const start = Number(new URL(String(url)).searchParams.get('skip'))
  return json(records.slice(start, start + 50))
})
let admin: number, candidate: number
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Source runner operation failed'), details))
beforeAll(async () => {
  const users = await sql`insert into users (name,role) values ('Runner Admin','ADMIN'),('Runner Candidate','USER') returning id`
  admin = users[0]!.id; candidate = users[1]!.id
})
afterAll(async () => {
  await closeDatabase()
  await sql`delete from source_imports where source_key=${key}`
  await sql`delete from applications where vacancy_id in (select id from vacancies where source_name=${key})`
  await sql`delete from vacancies where source_name=${key}`
  await sql`delete from organisations where slug=${site}`
  if (admin && candidate) await sql`delete from users where id in (${admin},${candidate})`
  await sql.end(); vi.unstubAllGlobals()
})
async function expire() { await sql`update source_imports set expires_at=now()-interval '1 second', retry_after_at=null where source_key=${key}` }

describe('bounded source runner with durable batch checkpoints', () => {
  it('fetches outside locks, refuses overlapping runs, survives committed-response retry and resumes the next batch', async () => {
    const records = Array.from({ length: 51 }, () => raw())
    const base = transportFor(records)
    let release!: () => void
    let entered!: () => void
    const enteredPromise = new Promise<void>(resolve => { entered = resolve })
    const pause = new Promise<void>(resolve => { release = resolve })
    const transport = vi.fn<typeof fetch>().mockImplementation(async (...args) => { entered(); await pause; return base(...args) })
    const runID = randomUUID()
    const running = fetchSourceRun(source, runID, admin, transport)
    await enteredPromise
    try {
      expect((await getSourceProgress(source, admin))!.state).toBe('FETCHING')
      await expect(fetchSourceRun(source, randomUUID(), admin, base)).rejects.toMatchObject({ statusCode: 409 })
      expect(base).not.toHaveBeenCalled()
      const locks = await sql`select count(*)::int as count from pg_locks where locktype='advisory' and database=(select oid from pg_database where datname=current_database())`
      expect(locks[0]!.count).toBe(0)
    } finally { release() }
    expect(await running).toMatchObject({ state: 'READY', nextOffset: 0, report: { recordCount: 51 } })
    expect(await sql`select id from vacancies where source_name=${key}`).toHaveLength(0)
    const plan = await previewSourceBatch(source, runID, admin)
    expect(plan.preview.rowCount).toBe(50)
    const command = { runID, offset: plan.offset, revision: plan.preview.revision! }
    const confirms = await Promise.all([importSourceBatch(source, command, admin), importSourceBatch(source, command, admin)])
    for (const result of confirms) expect(result).toMatchObject({ state: 'READY', nextOffset: 50, report: { created: 50 } })
    await closeDatabase() // Resume using a new pool, not in-process progress.
    const next = await previewSourceBatch(source, runID, admin)
    expect(next.preview.rowCount).toBe(1)
    expect(await importSourceBatch(source, { runID, offset: next.offset, revision: next.preview.revision! }, admin)).toMatchObject({ state: 'IMPORTED', nextOffset: 51, report: { created: 51 } })
    const [row] = await sql`select items from source_imports where source_key=${key}`
    expect(row!.items).toBeNull()
    expect(await sql`select id from vacancies where source_name=${key} and status!='DRAFT'`).toHaveLength(0)
    // Replaying the completed fetch never calls the source again.
    expect((await fetchSourceRun(source, runID, admin, base)).state).toBe('IMPORTED')
    expect(base).toHaveBeenCalledTimes(2)
  })

  it('keeps publication and application IDs on unchanged retry; a changed import returns to review', async () => {
    const [vacancy] = await sql`select id,source_external_id from vacancies where source_name=${key} order by id limit 1`
    await reviewVacancy(vacancy!.id, { status: 'PUBLISHED', reviewStatus: 'VERIFIED' })
    const [application] = await sql`insert into applications (user_id,vacancy_id) values (${candidate},${vacancy!.id}) returning id`
    const record = raw(vacancy!.source_external_id)
    for (const changed of [false, true]) {
      const runID = randomUUID()
      await fetchSourceRun(source, runID, admin, transportFor([{ ...record, text: changed ? 'Changed Fictional Runner Engineer' : record.text }]))
      const plan = await previewSourceBatch(source, runID, admin)
      expect(plan.preview.summary).toMatchObject(changed ? { updated: 1, withdrawnPublished: 1 } : { unchanged: 1 })
      const result = await importSourceBatch(source, { runID, offset: 0, revision: plan.preview.revision! }, admin)
      expect(result.report).toMatchObject(changed ? { updated: 1 } : { unchanged: 1 })
      expect((await sql`select status from vacancies where id=${vacancy!.id}`)[0]!.status).toBe(changed ? 'DRAFT' : 'PUBLISHED')
    }
    expect(await sql`select id from applications where id=${application!.id}`).toHaveLength(1)
  })

  it('rejects stale preview atomically and recomputes the same saved snapshot without re-fetch', async () => {
    const [vacancy] = await sql`select id,source_external_id from vacancies where source_name=${key} order by id limit 1`
    const runID = randomUUID(); const transport = transportFor([raw(vacancy!.source_external_id)])
    await fetchSourceRun(source, runID, admin, transport)
    const plan = await previewSourceBatch(source, runID, admin)
    await sql`update vacancies set title='Concurrent correction' where id=${vacancy!.id}`
    await expect(importSourceBatch(source, { runID, offset: 0, revision: plan.preview.revision! }, admin)).rejects.toMatchObject({ statusCode: 409 })
    expect((await getSourceProgress(source, admin))!.nextOffset).toBe(0)
    const fresh = await previewSourceBatch(source, runID, admin)
    await importSourceBatch(source, { runID, offset: 0, revision: fresh.preview.revision! }, admin)
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it('never imports a partial page set, skips invalid records, or archives on fetch failure', async () => {
    const count = await sql`select count(*)::int as total from vacancies where source_name=${key}`
    const pageFailure = vi.fn<typeof fetch>().mockResolvedValueOnce(json(Array.from({ length: 50 }, () => raw()))).mockRejectedValueOnce(new Error('private-provider-error'))
    expect(await fetchSourceRun(source, randomUUID(), admin, pageFailure)).toMatchObject({ state: 'FAILED', report: { failure: 'NETWORK', recordCount: 0 } })
    const bad = await fetchSourceRun(source, randomUUID(), admin, transportFor([raw(), { id: 'bad' }]))
    expect(bad).toMatchObject({ state: 'FAILED', report: { failure: 'INVALID_RECORDS', recordCount: 2 } })
    expect(await sql`select count(*)::int as total from vacancies where source_name=${key}`).toEqual(count)
    expect(JSON.stringify(bad)).not.toContain('private-provider-error')
    expect((await sql`select items from source_imports where source_key=${key}`)[0]!.items).toBeNull()
  })

  it('honors retry-after, rejects revoked roles and expired/config-changed snapshots', async () => {
    const limited = await fetchSourceRun(source, randomUUID(), admin, vi.fn<typeof fetch>().mockResolvedValue(new Response('hidden', { status: 429, headers: { 'retry-after': '60' } })))
    expect(limited.state).toBe('FAILED'); expect(limited.retryAfterAt).not.toBeNull()
    await expect(fetchSourceRun(source, randomUUID(), admin, transportFor([]))).rejects.toMatchObject({ statusCode: 429 })
    await expire()
    const runID = randomUUID()
    await fetchSourceRun(source, runID, admin, transportFor([raw()]))
    await expect(previewSourceBatch(source, runID, candidate)).rejects.toMatchObject({ statusCode: 403 })
    await expect(previewSourceBatch({ ...source, approval: { ...source.approval, reference: 'Changed approval revision' } }, runID, admin)).rejects.toMatchObject({ statusCode: 409 })
    await sql`update users set role='USER' where id=${admin}`
    await expect(previewSourceBatch(source, runID, admin)).rejects.toMatchObject({ statusCode: 403 })
    await sql`update users set role='ADMIN' where id=${admin}`
    const plan = await previewSourceBatch(source, runID, admin)
    await expire()
    await expect(importSourceBatch(source, { runID, offset: 0, revision: plan.preview.revision! }, admin)).rejects.toMatchObject({ statusCode: 409 })
    expect((await getSourceProgress(source, admin))!.state).toBe('EXPIRED')
    expect((await sql`select items from source_imports where source_key=${key}`)[0]!.items).toBeNull()
  })

  it('rejects oversized normalized snapshots and a role revoked while the source request was in flight', async () => {
    const records = Array.from({ length: 110 }, () => ({ ...raw(), descriptionPlain: 'x'.repeat(20_000) }))
    expect(await fetchSourceRun(source, randomUUID(), admin, transportFor(records))).toMatchObject({ state: 'FAILED', report: { failure: 'SNAPSHOT_LIMIT' } })
    const transport = vi.fn<typeof fetch>().mockImplementation(async () => {
      await sql`update users set role='USER' where id=${admin}`
      return json([raw()])
    })
    await expect(fetchSourceRun(source, randomUUID(), admin, transport)).rejects.toMatchObject({ statusCode: 403 })
    expect((await sql`select state,items from source_imports where source_key=${key}`)[0]).toEqual({ state: 'FETCHING', items: null })
    await sql`update users set role='ADMIN' where id=${admin}`
    await expire()
  })

  it('rejects a late old worker after lease takeover; empty feeds do not archive the catalogue', async () => {
    let release!: () => void; let entered!: () => void
    const pause = new Promise<void>(resolve => { release = resolve })
    const ready = new Promise<void>(resolve => { entered = resolve })
    const old = fetchSourceRun(source, randomUUID(), admin, vi.fn<typeof fetch>().mockImplementation(async () => { entered(); await pause; return json([raw()]) }))
    const rejected = expect(old).rejects.toMatchObject({ statusCode: 409 })
    await ready; await expire()
    const count = await sql`select count(*)::int as total from vacancies where source_name=${key}`
    expect(await fetchSourceRun(source, randomUUID(), admin, transportFor([]))).toMatchObject({ state: 'IMPORTED', nextOffset: 0, report: { recordCount: 0 } })
    release(); await rejected
    expect(await sql`select count(*)::int as total from vacancies where source_name=${key}`).toEqual(count)
  })
})
