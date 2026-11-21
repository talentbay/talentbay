import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import example from '../../docs/examples/relocation-synthetic.v1.json' with { type: 'json' }

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const marker = `Relocation Contract ${randomUUID()}`
const previewPath = '/api/v1/relocation/preview'
const headers = { origin: 'http://127.0.0.1:3129', 'content-type': 'application/json' }
test.afterAll(async () => { await sql`delete from relocation_locations where notes=${marker}`; await sql.end() })

test('compiled API never labels corrupt/future/unreviewed data VERIFIED and handles zero income', async ({ request }) => {
  const costs = { rent: 1000, utilities: 100, groceries: 200, transport: 50, healthcare: 50, other: 100 }
  const moving = { flight: 200, visa: 100, deposit: 1000, temporaryHousing: 300, other: 100 }
  const sources = [{ label: 'Fictional contract fixture only', url: 'https://example.invalid/test', accessedAt: '2026-01-01' }]
  const reviewedAt = new Date().toISOString()
  const snapshot = { schemaVersion: 1, purpose: 'PILOT', record: {
    ...structuredClone(example.records[0]!), status: 'VERIFIED', monthlyCosts: costs, oneTimeCosts: moving,
    sources: sources.map(source => ({ ...source, covers: ['TAX', 'RENT', 'LIVING', 'MOVE'] })),
    review: { at: reviewedAt, by: 'Fictional contract reviewer', reference: 'Fictional test review only', validUntil: '2099-12-31' },
  } }
  const [row] = await sql`insert into relocation_locations(country_code,city,currency,status,monthly_costs,one_time_costs,tax_model,sources,effective_from,reviewed_at,dataset_snapshot,notes)
    values('GB','London','GBP','VERIFIED',${sql.json(costs)},${sql.json(moving)},${sql.json({ type: 'effective_rate', rateBps: 2000 })},${sql.json(sources)},'2026-01-01T00:00:00Z',${reviewedAt},${sql.json(snapshot)},${marker}) returning id`
  const key = `location-${row!.id}`
  const endpoint = `${previewPath}?location=${key}&annualGross=0`
  const good = await request.get(endpoint)
  expect(good.status()).toBe(200)
  expect(good.headers()['cache-control']).toBe('no-store')
  const zero = await good.json()
  expect(zero).toMatchObject({ dataStatus: 'VERIFIED', monthly: { gross: 0, netAfterTax: 0, disposable: -1500 }, oneTimeMove: 1700 })
  const postZero = await request.post(previewPath, { headers, data: { location: key, annualGross: 0 } })
  expect(postZero.status()).toBe(200)
  expect(postZero.headers()['cache-control']).toBe('no-store')
  expect(await postZero.json()).toEqual(zero)

  const legacy = await request.get(previewPath, { params: { location: key, annualGross: '1234.56', extra: 'ignored' } })
  const post = await request.post(previewPath, { headers, data: { location: ` ${key.toUpperCase()} `, annualGross: '1234.56' } })
  expect(legacy.status()).toBe(200)
  expect(post.status()).toBe(200)
  const fractional = await post.json()
  expect(fractional.annualGross).toBe(1234.56)
  expect(fractional).toEqual(await legacy.json())

  await sql`update relocation_locations set currency='ZZZ' where id=${row!.id}`
  const unsupportedGet = await request.get(endpoint)
  const unsupportedPost = await request.post(previewPath, { headers, data: { location: key, annualGross: 0 } })
  expect(unsupportedGet.status()).toBe(400)
  expect(unsupportedPost.status()).toBe(400)
  expect(unsupportedPost.headers()['cache-control']).toBe('no-store')
  expect(await unsupportedPost.json()).toEqual(await unsupportedGet.json())
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

test('anonymous preview POST rejects invalid input without reflecting request data', async ({ request }) => {
  for (const data of [
    { location: 'london', annualGross: 'invalid-salary' },
    { location: 'london', annualGross: 123.456 },
    { location: 'london' },
    { location: 'invalid destination!', annualGross: 0 },
    { location: 'london', annualGross: 0, extra: 'unexpected-field' },
    Buffer.from('{"location":"london","annualGross":'),
  ]) {
    const response = await request.post(previewPath, { headers, data })
    expect(response.status()).toBe(400)
    expect(response.headers()['cache-control']).toBe('no-store')
    expect(await response.json()).toEqual({ error: true, statusCode: 400, statusMessage: 'Invalid request', message: 'Invalid request' })
  }
})

test('preview POST requires same-origin, bounded JSON', async ({ request }) => {
  const body = JSON.stringify({ location: 'london', annualGross: 0 })
  for (const [requestHeaders, data, expected] of [
    [{ 'content-type': 'application/json' }, body, 403],
    [{ ...headers, origin: 'https://other.example' }, body, 403],
    [{ ...headers, 'content-type': 'text/plain' }, body, 415],
    [headers, ' '.repeat(1024) + body, 413],
  ] as const) {
    const response = await request.post(previewPath, { headers: requestHeaders, data: Buffer.from(data) })
    expect(response.status()).toBe(expected)
    expect(response.headers()['cache-control']).toBe('no-store')
  }
})
