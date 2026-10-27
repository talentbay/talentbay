import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const city = `Relocation Contract ${randomUUID()}`
test.afterAll(async () => { await sql`delete from relocation_locations where city=${city}`; await sql.end() })

test('compiled API never labels corrupt/future/unreviewed data VERIFIED and handles zero income', async ({ request }) => {
  const costs = { rent: 1000, utilities: 100, groceries: 200, transport: 50, healthcare: 50, other: 100 }
  const moving = { flight: 200, visa: 100, deposit: 1000, temporaryHousing: 300, other: 100 }
  const sources = [{ label: 'Fictional contract fixture only', url: 'https://example.invalid/test', accessedAt: '2026-01-01' }]
  const [row] = await sql`insert into relocation_locations(country_code,city,currency,status,monthly_costs,one_time_costs,tax_model,sources,effective_from,reviewed_at)
    values('GB',${city},'GBP','VERIFIED',${sql.json(costs)},${sql.json(moving)},${sql.json({ type: 'effective_rate', rateBps: 2000 })},${sql.json(sources)},'2026-01-01',now()) returning id`
  const key = `location-${row!.id}`
  const endpoint = `/api/v1/relocation/preview?location=${key}&annualGross=0`
  const good = await request.get(endpoint)
  expect(good.status()).toBe(200)
  expect(await good.json()).toMatchObject({ dataStatus: 'VERIFIED', monthly: { gross: 0, netAfterTax: 0, disposable: -1500 }, oneTimeMove: 1700 })
  await sql`update relocation_locations set currency='ZZZ' where id=${row!.id}`
  expect((await request.get(endpoint)).status()).toBe(400)
  await sql`update relocation_locations set currency='GBP' where id=${row!.id}`
  await sql`update relocation_locations set tax_model=${sql.json({ type: 'progressive', personalAllowance: 0, brackets: [{ upTo: 50000, rateBps: 2000 }] })} where id=${row!.id}`
  expect((await request.get(endpoint)).status()).toBe(400)
  expect((await (await request.get('/api/v1/relocation/locations')).json()).items.some((item: { key: string }) => item.key === key)).toBe(false)
  await sql`update relocation_locations set tax_model=${sql.json({ type: 'effective_rate', rateBps: 2000 })},reviewed_at=now()+interval '1 day' where id=${row!.id}`
  expect((await request.get(endpoint)).status()).toBe(400)
  await sql`update relocation_locations set reviewed_at=null where id=${row!.id}`
  expect((await request.get(endpoint)).status()).toBe(400)
  for (const value of ['0xFF', '', '1e6', 'Infinity', '-1', '2000001']) expect((await request.get(`/api/v1/relocation/preview?location=london&annualGross=${value}`)).status()).toBe(400)
  expect((await request.get('/api/v1/relocation/preview?location=london')).status()).toBe(400)
  expect((await request.get('/api/v1/relocation/preview?annualGross=1000')).status()).toBe(400)
})
