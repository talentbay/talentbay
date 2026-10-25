import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, expect, it } from 'vitest'
import { closeDatabase } from '#server/db'
import { getRelocationPreview, listRelocationLocations, toLocationKey } from '#server/repositories/relocation'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const city = `São Browser ${randomUUID().slice(0, 8)}`
const costs = { rent: 1000, utilities: 100, groceries: 200, transport: 50, healthcare: 100, other: 50 }
const oneTime = { flight: 200, visa: 0, deposit: 1000, temporaryHousing: 300, other: 0 }
afterAll(async () => { await closeDatabase(); await sql`delete from relocation_locations where city = ${city}`; await sql.end() })

it('distinguishes same-named destinations, supports accents and rejects ambiguous legacy keys', async () => {
  const ids: number[] = []
  for (const country of ['DE', 'GB']) {
    const [row] = await sql`insert into relocation_locations (country_code, city, currency, status, monthly_costs, one_time_costs, tax_model, effective_from, reviewed_at) values (${country}, ${city}, ${country === 'DE' ? 'EUR' : 'GBP'}, 'VERIFIED', ${sql.json(costs)}, ${sql.json(oneTime)}, ${sql.json({ type: 'effective_rate', rateBps: 2000 })}, now(), now()) returning id`
    ids.push(row!.id)
  }
  const destinations = (await listRelocationLocations()).filter(location => location.city === city)
  expect(destinations.map(value => value.key).sort()).toEqual(ids.map(id => `location-${id}`).sort())
  for (const destination of destinations) {
    const result = await getRelocationPreview(destination.key, 60_000)
    expect(result).toMatchObject({ location: { key: destination.key, city, countryCode: destination.countryCode, currency: destination.currency }, dataStatus: 'VERIFIED', monthly: { netAfterTax: 4000, disposable: 2500 } })
  }
  expect(await getRelocationPreview(toLocationKey(city), 60_000)).toBeUndefined()
  await sql`update relocation_locations set status = 'DRAFT' where id = ${ids[1]!}`
  expect(await getRelocationPreview(toLocationKey(city), 60_000)).toMatchObject({ location: { countryCode: 'DE' } })
  expect(await getRelocationPreview(`location-${ids[1]}`, 60_000)).toBeUndefined()
})
