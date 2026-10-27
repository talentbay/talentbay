import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import example from '../../docs/examples/relocation-synthetic.v1.json'
import { closeDatabase } from '#server/db'
import { getRelocationPreview, listRelocationLocations } from '#server/repositories/relocation'
import { importRelocationDataset, previewRelocationDataset } from '#server/services/relocation/import-dataset'
import { relocationDatasetSchema } from '#server/services/relocation/dataset-contract'
import type { RelocationDataset } from '#server/services/relocation/dataset-contract'
import { relocationPilotCities } from '#shared/relocation/geography'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const prefix = `Dataset fixture ${randomUUID()}`
const ids = new Set<number>()
let admin: number, other: number
function dataset(keys: ('london' | 'berlin')[] = ['london'], status: 'DRAFT' | 'VERIFIED' | 'STALE' = 'VERIFIED'): RelocationDataset {
  return relocationDatasetSchema.parse({ ...example, purpose: 'PILOT', records: keys.map(destination => ({
    ...structuredClone(example.records[0]!), destination, status,
    currency: relocationPilotCities.find(city => city.key === destination)!.currency,
    review: status === 'DRAFT' ? null : { at: '2026-01-02T00:00:00Z', by: `${prefix} reviewer`, reference: `${prefix} initial approval`, validUntil: '2099-12-31' },
  })) })
}
async function apply(input: RelocationDataset) {
  const preview = await previewRelocationDataset(input, admin)
  const result = await importRelocationDataset(input, admin, preview.revision)
  result.rows.forEach(row => ids.add(row.id))
  return { preview, result }
}
beforeAll(async () => {
  const users = await sql`insert into users(name,role) values (${prefix},'ADMIN'),(${`${prefix} nonadmin`},'USER') returning id`
  admin = users[0]!.id; other = users[1]!.id
  expect(await sql`select id from relocation_locations where (country_code='GB' and lower(btrim(city))='london') or (country_code='DE' and lower(btrim(city))='berlin')`).toHaveLength(0)
})
afterAll(async () => {
  await closeDatabase()
  if (ids.size) await sql`delete from relocation_locations where id in ${sql([...ids])}`
  if (admin && other) await sql`delete from users where id in (${admin},${other})`
  await sql.end()
})

describe('versioned relocation import/review on disposable PostgreSQL', () => {
  it('previews without writes, applies full metadata and replays without changing timestamps or IDs', async () => {
    const input = dataset()
    const before = await sql`select id from relocation_locations`
    const preview = await previewRelocationDataset(input, admin)
    expect(preview.summary).toMatchObject({ created: 1, updated: 0 })
    expect(await sql`select id from relocation_locations`).toEqual(before)
    const first = await importRelocationDataset(input, admin, preview.revision)
    const id = first.rows[0]!.id; ids.add(id)
    const [saved] = await sql`select * from relocation_locations where id=${id}`
    expect(saved).toMatchObject({ status: 'VERIFIED', imported_by_user_id: admin, dataset_snapshot: { schemaVersion: 1, purpose: 'PILOT', record: { destination: 'london' } } })
    expect((await listRelocationLocations()).find(city => city.key === `location-${id}`)).toMatchObject({ city: 'London', dataStatus: 'VERIFIED' })
    expect(await getRelocationPreview(`location-${id}`, 60_000)).toMatchObject({ monthly: { netAfterTax: 4000, disposable: 2500 } })
    const retry = await importRelocationDataset(input, admin, preview.revision)
    expect(retry.rows).toEqual([{ id, destination: 'london', operation: 'UNCHANGED' }])
    expect((await sql`select * from relocation_locations where id=${id}`)[0]).toEqual(saved)
    expect(JSON.stringify(preview)).not.toContain('taxResidency')
  })
  it('requires new review for changed approved content; drafts withdraw, new review restores the same ID', async () => {
    const next = dataset()
    next.records[0]!.monthlyCosts.rent = 1200
    await expect(previewRelocationDataset(next, admin)).rejects.toMatchObject({ code: 'INPUT', issues: [{ code: 'new_review_required' }] })
    next.records[0]!.review!.at = '2026-01-02T00:00:00+00:00'
    await expect(previewRelocationDataset(next, admin)).rejects.toMatchObject({ code: 'INPUT', issues: [{ code: 'new_review_required' }] })
    next.records[0]!.status = 'DRAFT'; next.records[0]!.review = null
    const { result } = await apply(next)
    const id = result.rows[0]!.id
    expect(await getRelocationPreview(`location-${id}`, 60_000)).toBeUndefined()
    next.records[0]!.status = 'VERIFIED'
    next.records[0]!.review = { ...dataset().records[0]!.review!, reference: `${prefix} revised approval` }
    expect((await apply(next)).result.rows[0]!.id).toBe(id)
    expect(await getRelocationPreview(`location-${id}`, 60_000)).toMatchObject({ monthly: { disposable: 2300 } })
  })
  it('rejects stale preview and revoked actors without partial writes; concurrent applies deduplicate', async () => {
    const input = dataset(['london', 'berlin'], 'DRAFT')
    const preview = await previewRelocationDataset(input, admin)
    await sql`update relocation_locations set notes='Concurrent private operator correction' where country_code='GB' and city='London'`
    await expect(importRelocationDataset(input, admin, preview.revision)).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(await sql`select id from relocation_locations where country_code='DE' and city='Berlin'`).toHaveLength(0)
    await expect(previewRelocationDataset(input, other)).rejects.toMatchObject({ code: 'ACCESS' })
    const fresh = await previewRelocationDataset(input, admin)
    const results = await Promise.all([importRelocationDataset(input, admin, fresh.revision), importRelocationDataset(input, admin, fresh.revision)])
    results.flatMap(result => result.rows).forEach(row => ids.add(row.id))
    expect(new Set(results.flatMap(result => result.rows.map(row => row.id))).size).toBe(2)
    expect((await sql`select notes from relocation_locations where country_code='GB' and city='London'`)[0]!.notes).toBe('Concurrent private operator correction')
    await sql`update users set role='USER' where id=${admin}`
    try { await expect(importRelocationDataset(input, admin, fresh.revision)).rejects.toMatchObject({ code: 'ACCESS' }) }
    finally { await sql`update users set role='ADMIN' where id=${admin}` }
  })
  it('fails closed on expired approvals, direct numeric drift and synthetic/legacy metadata', async () => {
    const input = dataset(['berlin'])
    const { result } = await apply(input)
    const id = result.rows[0]!.id
    await sql`update relocation_locations set monthly_costs=jsonb_set(monthly_costs,'{rent}','1500') where id=${id}`
    expect(await getRelocationPreview(`location-${id}`, 60_000)).toBeUndefined()
    expect((await listRelocationLocations()).some(city => city.key === `location-${id}`)).toBe(false)
    await apply(input)
    input.records[0]!.review!.validUntil = '2026-01-03'
    await expect(previewRelocationDataset(input, admin)).rejects.toMatchObject({ code: 'INPUT' })
    await sql`update relocation_locations set dataset_snapshot=jsonb_set(dataset_snapshot,'{record,review,validUntil}','"2026-01-03"') where id=${id}`
    expect(await getRelocationPreview(`location-${id}`, 60_000)).toBeUndefined()
    await sql`update relocation_locations set dataset_snapshot=null where id=${id}`
    expect(await getRelocationPreview(`location-${id}`, 60_000)).toBeUndefined()
    const synthetic = relocationDatasetSchema.parse(example)
    const imported = await apply(synthetic)
    expect((await sql`select status from relocation_locations where id=${imported.result.rows[0]!.id}`)[0]!.status).toBe('DRAFT')
    expect(await getRelocationPreview(`location-${imported.result.rows[0]!.id}`, 60_000)).toBeUndefined()
  })
  it('rolls back the first city if the second write fails inside PostgreSQL', async () => {
    const name = `dataset_rollback_${randomUUID().replaceAll('-', '')}`
    const before = await sql`select * from relocation_locations where id in ${sql([...ids])} order by id`
    await sql`create function ${sql(name)}() returns trigger language plpgsql as $$begin if new.city = 'Berlin' and new.status = 'STALE' then raise exception 'Synthetic dataset rollback fixture'; end if; return new; end$$`
    try {
      await sql`create trigger ${sql(name)} before insert or update on relocation_locations for each row execute function ${sql(name)}()`
      const input = dataset(['london', 'berlin'], 'STALE')
      const preview = await previewRelocationDataset(input, admin)
      await expect(importRelocationDataset(input, admin, preview.revision)).rejects.toMatchObject({ cause: { code: 'P0001', message: 'Synthetic dataset rollback fixture' } })
      expect(await sql`select * from relocation_locations where id in ${sql([...ids])} order by id`).toEqual(before)
    }
    finally {
      await sql`drop trigger if exists ${sql(name)} on relocation_locations`
      await sql`drop function ${sql(name)}()`
    }
  })
})
