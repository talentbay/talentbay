import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const token = `Queue${randomUUID().replaceAll('-', '')}`
const slug = token.toLowerCase()
const subject = randomInt(1_000_000_000, 1_000_000_000_000)
let companyID: number, actorID: number
async function signIn(context: BrowserContext) {
  const response = await context.request.post('/api/v1/auth/telegram', { headers: { origin: 'http://127.0.0.1:3129' }, data: { initData: signedLaunch(subject, 'Queue Operator Fixture') } })
  expect(response.status()).toBe(200)
  actorID = (await response.json()).user.id
  await sql`update users set role='ADMIN' where id=${actorID}`
  expect((await context.request.post('/api/v1/auth/telegram', { headers: { origin: 'http://127.0.0.1:3129' }, data: { initData: signedLaunch(subject, 'Queue Operator Fixture') } })).status()).toBe(200)
}
test.beforeAll(async () => {
  await sql`insert into users (name,email,created_at) select ${token}||' Fictional User '||n,${slug}||'-'||n||'@talentbay.invalid','2026-10-27T00:00:00.123456Z'::timestamptz from generate_series(1,111) n`
  const [company] = await sql`insert into organisations (name,slug,status) values ('Fictional Queue Company',${slug},'ACTIVE') returning id`
  companyID = company!.id
  await sql`insert into vacancies (organisation_id,slug,title,description,employment_type,workplace_type,country_code,source_name,updated_at)
    select ${companyID},${slug}||'-'||n,${token}||' Fictional Role '||n,'Fictional queue-only content for isolated pagination and selected-context checks.',
      'FULL_TIME','REMOTE','GB',${token},'2026-10-27T00:00:00.123456Z'::timestamptz from generate_series(1,111) n`
})
test.afterAll(async () => {
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql`delete from users where email like ${slug+'-%@talentbay.invalid'}`
  if (actorID) await sql`delete from users where id=${actorID}`
  await sql.end()
})

test('operator reads every user page, preserves URL filters/reload and gets a narrow scrollable registry', async ({ page, context }, testInfo) => {
  await signIn(context)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/ktulhu/v1/users?q=${token}&role=USER`)
  await expect(page.locator('tbody tr')).toHaveCount(25)
  await expect(page.getByText('25 of 111 accounts · newest first', { exact: true })).toBeVisible()
  const first = await page.locator('tbody tr').first().textContent()
  await page.getByRole('link', { name: 'Older users', exact: true }).click()
  await expect(page).toHaveURL(/before=/)
  await expect(page.locator('tbody tr').first()).not.toHaveText(first!)
  const second = await page.locator('tbody tr').first().textContent()
  const secondURL = page.url()
  await page.reload()
  await expect(page.locator('tbody tr').first()).toHaveText(second!)
  await expect(page).toHaveURL(secondURL)
  for (let pageNumber = 0; pageNumber < 3; pageNumber++) await page.getByRole('link', { name: 'Older users', exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(11)
  await expect(page.getByRole('link', { name: 'Older users', exact: true })).toHaveCount(0)
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('link', { name: 'Newest users', exact: true }).scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`users-page-${width}.png`) })
    if (width === 320) {
      const registry = page.getByRole('region', { name: 'User registry', exact: true })
      await registry.focus()
      await registry.press('ArrowRight')
      await expect.poll(() => registry.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    }
  }
  await page.getByLabel('Search users', { exact: true }).fill('no matching fictional account')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page).not.toHaveURL(/before=/)
  await expect(page.getByText('No users found', { exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('review page and selected vacancy survive reload; filters reset the cursor; revoked admin cannot read either queue', async ({ page, context }) => {
  await signIn(context)
  await page.goto(`/ktulhu/v1/vacancies?q=${token}&reviewStatus=UNREVIEWED`)
  await expect(page.locator('tbody tr')).toHaveCount(25)
  await page.getByRole('link', { name: 'Older records', exact: true }).click()
  await expect(page).toHaveURL(/before=/)
  await expect(page.locator('tbody tr')).toHaveCount(25)
  const secondURL = page.url()
  await page.locator('tbody tr').first().getByRole('button', { name: 'Review', exact: true }).click()
  await expect(page).toHaveURL(/review=/)
  await expect(page.getByRole('dialog')).toBeVisible()
  const selectedURL = page.url()
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page).toHaveURL(selectedURL)
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page).toHaveURL(secondURL)
  await page.getByLabel('Search vacancy queue').fill('does-not-match-a-queue-record')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
  await expect(page).not.toHaveURL(/before=|review=/)
  await expect(page.getByText('No vacancies in this queue', { exact: true })).toBeVisible()
  await page.goto('/ktulhu/v1')
  await page.getByRole('link').filter({ hasText: 'Unreviewed vacancies' }).click()
  await expect(page).toHaveURL(/reviewStatus=UNREVIEWED/)
  for (const endpoint of ['/api/v1/admin/users', '/api/v1/admin/vacancies']) {
    const response = await context.request.get(endpoint)
    expect(response.status()).toBe(200)
    expect(response.headers()['cache-control']).toBe('no-store')
    for (const query of ['limit=51', 'before=bad', `before=${'x'.repeat(513)}`]) expect((await context.request.get(`${endpoint}?${query}`)).status()).toBe(400)
  }
  await sql`update users set role='USER' where id=${actorID}`
  for (const endpoint of ['/api/v1/admin/users', '/api/v1/admin/vacancies']) {
    const response = await context.request.get(endpoint)
    expect(response.status()).toBe(403)
    expect(response.headers()['cache-control']).toBe('no-store')
  }
})
