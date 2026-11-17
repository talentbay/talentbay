import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'
import type { AdminDashboard } from '../../shared/types/admin-dashboard'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const token = `ops-browser-${randomUUID()}`, subject = randomInt(1_000_000_000, 1_000_000_000_000)
const users: number[] = [], ids: number[] = []
let actorID: number, companyID: number
async function signIn(context: BrowserContext) {
  const sign = () => context.request.post('/api/v1/auth/telegram', { headers: { origin: 'http://127.0.0.1:3129' }, data: { initData: signedLaunch(subject, 'Operations Browser Fixture') } })
  const first = await sign(); expect(first.status()).toBe(200); actorID = (await first.json()).user.id
  await sql`update users set role='ADMIN' where id=${actorID}`
  expect((await sign()).status()).toBe(200)
}
test.beforeAll(async () => {
  const [company] = await sql`insert into organisations (name,slug,status) values ('Fictional Operations Company',${token},'DRAFT') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code)
    values (${companyID},${token},'Fictional International Platform Observability Engineer with a long operations title','No real applicant or company',
      'PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB') returning id`
  for (let n = 0; n < 28; n++) {
    const [user] = await sql`insert into users (name) values (${`Fictional Operations Candidate ${n}`}) returning id`
    users.push(user!.id)
    const [app] = await sql`insert into applications (user_id,vacancy_id,created_at) values (${user!.id},${vacancy!.id},now()-${n === 0 ? 45 : 2}*interval '1 day') returning id`
    ids.push(app!.id)
  }
})
test.afterAll(async () => {
  if (users.length) await sql`delete from users where id in ${sql(users)}`
  if (actorID) await sql`delete from users where id=${actorID}`
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql.end()
})

test('overview counters match queue filters; oldest opens off-page ID and survives reload at all widths', async ({ page, context }, info) => {
  await signIn(context)
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto('/ktulhu/v1?days=7')
  await expect(page.getByRole('heading', { name: 'Work overview', exact: true })).toBeVisible()
  const response = await context.request.get('/api/v1/admin/dashboard?days=7')
  expect(response.status()).toBe(200); expect(response.headers()['cache-control']).toBe('no-store')
  expect(response.headers()['x-request-id']).toMatch(/^[a-f0-9-]{36}$/)
  const data: AdminDashboard = await response.json()
  for (const [label, value, filter] of [
    ['Awaiting start', data.work.awaitingStart, 'stage=RECEIVED'], ['Needs an operator', data.work.needsOwner, 'work=needs-owner'],
    ['In progress', data.work.inProgress, 'work=in-progress'], ['My active work', data.work.mine, 'assignee=mine'],
  ] as const) {
    await page.getByRole('link', { name: `${label}: ${value}`, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(filter))
    await expect(page.getByText(new RegExp(`of ${value} applications · newest first`))).toBeVisible()
    await page.goBack()
  }
  await page.getByRole('link').filter({ hasText: `#${ids[0]}` }).click()
  await expect(page).toHaveURL(new RegExp(`review=${ids[0]}`))
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'TalentBay handling' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page).not.toHaveURL(/review=/)
  await expect(page.getByRole('list', { name: 'Candidate applications' }).getByRole('listitem')).toHaveCount(25)
  await page.getByRole('link', { name: 'Older applications', exact: true }).click()
  await expect(page.getByText(new RegExp(`of ${data.work.awaitingStart} applications · newest first`))).toBeVisible()
  await page.goto('/ktulhu/v1?days=90')
  const ninety: AdminDashboard = await (await context.request.get('/api/v1/admin/dashboard?days=90')).json()
  await page.getByRole('link', { name: `Applications received: ${ninety.activity.received}`, exact: true }).click()
  await expect(page).toHaveURL(/receivedFrom=.*receivedBefore=/)
  await expect(page.getByText(new RegExp(`of ${ninety.activity.received} applications · newest first`))).toBeVisible()
  await page.getByRole('button', { name: 'Clear period', exact: true }).click()
  await expect(page).not.toHaveURL(/receivedFrom|receivedBefore/)
  await page.goto('/ktulhu/v1')
  await page.getByRole('link').filter({ hasText: 'Public vacancies' }).click()
  await expect(page).toHaveURL(/publicOnly=true/)
  await expect(page.getByRole('checkbox', { name: 'Publicly visible only', exact: true })).toBeChecked()
  await expect(page.getByText('Vacancies unavailable', { exact: true })).toHaveCount(0)
  const publicQueue = await context.request.get('/api/v1/admin/vacancies?status=PUBLISHED&reviewStatus=VERIFIED&publicOnly=true')
  expect(publicQueue.status()).toBe(200)
  expect((await publicQueue.json()).total).toBe((await (await context.request.get('/api/v1/admin/dashboard')).json()).vacancies.published)
  await expect(page.getByText('No vacancies in this queue', { exact: true })).toBeVisible()
  await expect(page.getByText('Fictional International Platform Observability Engineer with a long operations title', { exact: true })).toHaveCount(0)
  await page.goto('/ktulhu/v1?days=7')
  for (const width of [320, 390, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.getByRole('link', { name: `Awaiting start: ${data.work.awaitingStart}`, exact: true })).toBeVisible()
    const target = await page.getByRole('link', { name: `Awaiting start: ${data.work.awaitingStart}`, exact: true }).boundingBox()
    expect(target!.width).toBeGreaterThanOrEqual(44); expect(target!.height).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if ([320, 390, 1440].includes(width)) await page.screenshot({ path: info.outputPath(`operator-overview-${width}.png`), fullPage: true, animations: 'disabled' })
  }
  expect(errors).toEqual([])
})

test('error and retry do not show zero; invalid periods and stale ADMIN sessions fail closed', async ({ page, context }) => {
  await signIn(context)
  let fail = true
  await page.route('**/api/v1/admin/dashboard*', async route => {
    if (fail) await route.fulfill({ status: 503, json: { statusCode: 503, statusMessage: 'Synthetic controlled failure' } })
    else await route.continue()
  })
  await page.goto('/ktulhu/v1')
  await expect(page.getByText('Operational data unavailable', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Current application work' })).toHaveCount(0)
  fail = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Current application work' })).toBeVisible()
  for (const query of ['days=365', 'days=7&days=30', 'actorID=42']) expect((await context.request.get(`/api/v1/admin/dashboard?${query}`)).status()).toBe(400)
  await sql`update users set role='USER' where id=${actorID}`
  for (const endpoint of ['/api/v1/admin/dashboard', '/api/v1/admin/applications?work=needs-owner']) {
    const response = await context.request.get(endpoint)
    expect(response.status()).toBe(403); expect(response.headers()['cache-control']).toBe('no-store')
    expect(await response.text()).not.toContain('Fictional Operations Candidate')
  }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByText('Operational data unavailable', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Current application work' })).toHaveCount(0)
})
