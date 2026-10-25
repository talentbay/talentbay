import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { vacancyCsvColumns } from '../../shared/types/vacancy-import'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const suffix = randomUUID()
const slug = `operator-${suffix}`
const source = `Operator fixture ${suffix}`
const subject = randomInt(1_000_000_000, 1_000_000_000_000)
const users: number[] = []
const origin = 'http://127.0.0.1:3129'
const headers = { origin }

function csv(title = 'Operator Test Engineer', country = 'GB') {
  const values: Record<string, string> = {
    source_name: source, source_url: 'https://example.com/fixture', source_external_id: suffix,
    company_name: 'Operator Company', company_slug: slug, vacancy_slug: slug, title,
    description: 'Complete fixture description, with a comma.\nSecond paragraph for review.',
    employment_type: 'FULL_TIME', workplace_type: 'REMOTE', country_code: country, city: 'London',
    salary_min: '50000', salary_max: '70000', salary_currency: 'GBP', salary_period: 'YEAR', skills: 'TypeScript|SQL',
    relocation_offered: 'true', visa_sponsorship: 'false',
  }
  return `${vacancyCsvColumns.join(',')}\n${vacancyCsvColumns.map(column => `"${(values[column] ?? '').replaceAll('"', '""')}"`).join(',')}\n`
}

async function signIn(context: BrowserContext, id = subject, admin = true) {
  const login = () => context.request.post('/api/v1/auth/telegram', { headers, data: { initData: signedLaunch(id, 'Operator Fixture') } })
  const response = await login()
  expect(response.status()).toBe(200)
  const { user } = await response.json()
  users.push(user.id)
  if (admin) {
    await sql`update users set role = 'ADMIN' where id = ${user.id}`
    expect((await login()).status()).toBe(200)
  }
  return user
}

test.afterAll(async () => {
  await sql`delete from applications where vacancy_id in (select id from vacancies where source_name = ${source})`
  await sql`delete from vacancies where source_name = ${source}`
  await sql`delete from organisations where slug = ${slug}`
  if (users.length) await sql`delete from users where id in ${sql([...new Set(users)])}`
  await sql.end()
})

test('CSV validation → atomic draft import → complete review → public record → changed re-import', async ({ page, context }, testInfo) => {
  await signIn(context)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ktulhu/v1/import')
  const file = page.getByLabel('Vacancy CSV file')
  await file.setInputFiles({ name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from(csv('Operator Test Engineer', 'INVALID')) })
  await page.getByRole('button', { name: 'Validate file' }).click()
  await expect(page.getByRole('heading', { name: 'Validation errors' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Validation errors' }).getByText('country_code')).toBeVisible()
  expect(await sql`select id from vacancies where source_name = ${source}`).toHaveLength(0)
  await file.setInputFiles({ name: 'vacancies.csv', mimeType: 'text/csv', buffer: Buffer.from(csv()) })
  await page.getByRole('button', { name: 'Validate file' }).click()
  await expect(page.getByRole('heading', { name: 'Import preview' })).toBeVisible()
  await expect(page.getByText('CREATED', { exact: true })).toBeVisible()
  expect(await sql`select id from vacancies where source_name = ${source}`).toHaveLength(0)
  await page.screenshot({ path: testInfo.outputPath('import-mobile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.getByText('Import complete', { exact: true })).toBeVisible()
  const [draft] = await sql`select id, status, review_status, created_by_user_id from vacancies where slug = ${slug}`
  expect(draft).toMatchObject({ status: 'DRAFT', review_status: 'UNREVIEWED' })
  expect(draft!.created_by_user_id).toBe(users[0])
  expect((await context.request.get(`/api/v1/vacancies/${slug}`)).status()).toBe(404)
  await page.getByRole('link', { name: 'Open review queue' }).click()
  await page.getByRole('row').filter({ hasText: 'Operator Test Engineer' }).getByRole('button', { name: 'Review', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/Second paragraph for review/)).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Verify & publish' })).toBeDisabled()
  await expect(dialog).toHaveCSS('opacity', '1')
  await page.screenshot({ path: testInfo.outputPath('review-mobile.png'), fullPage: true, animations: 'disabled' })
  // A concurrent source change makes an already-open review unsafe to publish.
  await sql`update vacancies set summary = 'Changed after opening' where id = ${draft!.id}`
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Verify & publish' }).click()
  await expect(dialog.getByText('Update not completed', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Verify & publish' })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Reload record' }).click()
  await expect(dialog.getByText('Changed after opening', { exact: true })).toBeVisible()
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Verify & publish' }).click()
  await expect(dialog).not.toBeVisible()
  await page.goto(`/jobs/${slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Operator Test Engineer')

  const next = csv('Re-imported Operator Engineer')
  const plan = await (await context.request.post('/api/v1/admin/vacancies/file', { headers, data: { mode: 'preview', csv: next } })).json()
  expect(plan.preview.summary.withdrawnPublished).toBe(1)
  expect((await context.request.post('/api/v1/admin/vacancies/file', { headers, data: { mode: 'import', csv: next, revision: plan.preview.revision } })).status()).toBe(200)
  const [changed] = await sql`select id, status, review_status from vacancies where slug = ${slug}`
  expect(changed).toMatchObject({ id: draft!.id, status: 'DRAFT', review_status: 'UNREVIEWED' })
  await page.goto(`/jobs/${slug}`)
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/ktulhu/v1')
  await expect(page.getByText('Public vacancies', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true })
  const dashboard = await (await context.request.get('/api/v1/admin/dashboard')).json()
  const [visible] = await sql`select count(*)::integer as total from vacancies v join organisations o on o.id = v.organisation_id where v.status = 'PUBLISHED' and v.review_status = 'VERIFIED' and o.status = 'ACTIVE'`
  expect(dashboard.vacancies.published).toBe(visible!.total)
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/ktulhu/v1', '/ktulhu/v1/import', '/ktulhu/v1/vacancies']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  }
  expect(errors).toEqual([])
})

test('operator endpoints enforce authorization, same origin, content types and limits', async ({ context }) => {
  await signIn(context, subject + 1, false)
  const endpoint = '/api/v1/admin/vacancies/file'
  const body = { mode: 'preview', csv: csv() }
  expect((await context.request.post(endpoint, { headers, data: body })).status()).toBe(403)
  await signIn(context, subject + 1)
  expect((await context.request.post(endpoint, { headers: { origin: 'https://attacker.invalid' }, data: body })).status()).toBe(403)
  expect((await context.request.post(endpoint, { headers: { ...headers, 'content-type': 'text/plain' }, data: 'not json' })).status()).toBe(415)
  expect((await context.request.post(endpoint, { headers: { ...headers, 'content-type': 'application/json' }, data: '{' })).status()).toBe(400)
  expect((await context.request.post(endpoint, { headers, data: { mode: 'preview', csv: 'x'.repeat(4 * 1024 * 1024) } })).status()).toBe(413)
  expect((await context.request.get(endpoint.replace('/file', ''))).headers()['cache-control']).toBe('no-store')
})
