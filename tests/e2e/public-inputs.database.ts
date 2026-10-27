import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const subject = randomInt(1_000_000_000, 1_000_000_000_000)
const headers = { origin: 'http://127.0.0.1:3129', 'content-type': 'application/json' }
test.afterAll(async () => {
  await sql`delete from users where id in (select user_id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject)})`
  await sql.end()
})

test('public JSON entrypoints reject raw oversized/malformed/type payloads before identity or query work', async ({ context }) => {
  const valid: Record<string, object> = {
    '/api/v1/auth/telegram': { initData: signedLaunch(subject, 'Bounded Public Fixture') },
    '/api/v1/vacancies/resolve': { slugs: ['fictional-not-present'] },
  }
  for (const [path, body] of Object.entries(valid)) {
    const large = await context.request.post(path, { headers, data: ' '.repeat(70_000)+JSON.stringify(body) })
    expect(large.status(), path).toBe(413)
    expect(large.headers()['cache-control']).toBe('no-store')
    for (const [extraHeaders, data, expected] of [
      [{ 'content-type': 'text/plain' }, JSON.stringify(body), 415],
      [{ 'content-encoding': 'gzip' }, JSON.stringify(body), 415],
      [{}, Buffer.from([0x7b, 0xff, 0x7d]), 400],
      [{}, '{"incomplete":', 400],
      [{}, { ...body, userID: 1, role: 'ADMIN' }, 400],
    ] as const) {
      const response = await context.request.post(path, { headers: { ...headers, ...extraHeaders }, data })
      expect(response.status(), path).toBe(expected)
      expect(response.headers()['cache-control']).toBe('no-store')
      const payload = await response.json()
      expect(Object.keys(payload).sort()).toEqual(['error','message','statusCode','statusMessage'])
      expect(JSON.stringify(payload)).not.toContain('initData')
    }
  }
  expect(await sql`select id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject)}`).toHaveLength(0)
  const resolved = await context.request.post('/api/v1/vacancies/resolve', { headers, data: valid['/api/v1/vacancies/resolve'] })
  expect(resolved.status()).toBe(200)
  expect(await resolved.json()).toEqual({ items: [], unavailableSlugs: ['fictional-not-present'] })
  expect((await context.request.post('/api/v1/auth/telegram', { headers, data: valid['/api/v1/auth/telegram'] })).status()).toBe(200)
})

test('legacy markup-shaped content renders as text and unsafe source schemes never become links', async ({ page }) => {
  const slug = `security-fixture-${randomUUID()}`
  const title = '<img src="https://attacker.invalid/pixel" onerror="window.__fixtureExecuted=true">'
  const description = '<script>window.__fixtureExecuted=true</script> Synthetic plain-text description.'
  let outbound = 0
  await page.route('https://attacker.invalid/**', route => { outbound++; return route.abort() })
  const [company] = await sql`insert into organisations (name,slug,status) values ('Synthetic Security Company',${slug},'ACTIVE') returning id`
  try {
    await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code,source_name,source_url)
      values (${company!.id},${slug},${title},${description},'PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB','Synthetic source','javascript:alert(1)')`
    await page.goto(`/jobs/${slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page.getByText(description, { exact: true })).toBeVisible()
    expect(await page.locator('a[href^="javascript:"]').count()).toBe(0)
    expect(await page.evaluate(() => '__fixtureExecuted' in window)).toBe(false)
    expect(outbound).toBe(0)
  } finally {
    await sql`delete from vacancies where organisation_id=${company!.id}`
    await sql`delete from organisations where id=${company!.id}`
  }
})
