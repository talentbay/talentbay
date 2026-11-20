import { randomInt, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
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
    source_published_at: '2024-02-01T10:00:00Z',
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
  const record = await (await context.request.get(`/api/v1/vacancies/${slug}`)).json()
  expect(record.provenance).toMatchObject({ sourcePublishedAt: '2024-02-01T10:00:00.000Z', sourceFetchedAt: null })
  expect(Date.parse(record.publishedAt)).toBeGreaterThan(Date.parse(record.provenance.sourcePublishedAt))
  expect(record.provenance.reviewedAt).toBe(record.publishedAt)
  expect(JSON.stringify(record)).not.toMatch(/reviewedBy|reviewer|Operator Fixture/)
  await expect(page.getByText('Source publication', { exact: true }).locator('..').locator('time')).toHaveAttribute('datetime', '2024-02-01T10:00:00.000Z')
  await expect(page.getByText('Source fetched', { exact: true }).locator('..').getByText('Not recorded')).toBeVisible()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (width < 1024) {
      const lastDate = page.getByText('Content checked', { exact: true }).locator('..')
      await lastDate.scrollIntoViewIfNeeded()
      const dateBox = await lastDate.boundingBox()
      const barBox = await page.locator('.candidate-bottom-nav').last().boundingBox()
      expect(dateBox!.y + dateBox!.height).toBeLessThanOrEqual(barBox!.y)
      await page.screenshot({ path: testInfo.outputPath(`provenance-bottom-${width}.png`), animations: 'disabled' })
    }
    await page.screenshot({ path: testInfo.outputPath(`provenance-${width}.png`), fullPage: true })
  }
  await page.goto(`/ktulhu/v1/vacancies?review=${draft!.id}`)
  await expect(dialog.getByText('Recorded reviewer: Operator Fixture', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Recheck listing', exact: true })).toBeDisabled()
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Recheck listing', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  const rechecked = await (await context.request.get(`/api/v1/vacancies/${slug}`)).json()
  expect(rechecked.publishedAt).toBe(record.publishedAt)
  expect(Date.parse(rechecked.provenance.reviewedAt)).toBeGreaterThanOrEqual(Date.parse(record.provenance.reviewedAt))
  // An ambiguous legacy publication remains unknown, even if the old ordering date exists.
  await sql`update vacancies set talentbay_published_at=null where id=${draft!.id}`
  await page.goto('/jobs?q=Operator%20Test%20Engineer')
  await expect(page.getByText('Publication date unavailable', { exact: true })).toBeVisible()
  await expect(page.getByText(/1970/)).toHaveCount(0)
  await sql`update vacancies set talentbay_published_at=${record.publishedAt} where id=${draft!.id}`

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
    for (const path of ['/ktulhu/v1', '/ktulhu/v1/import', '/ktulhu/v1/vacancies', '/ktulhu/v1/sources']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
  }
  expect(errors).toEqual([])
})

test('operator creates one draft without a file and can safely correct a published vacancy', async ({ page, context }, testInfo) => {
  await signIn(context, randomInt(1_000_000_000, 1_000_000_000_000))
  const key = 'editor-' + randomUUID()
  try {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/ktulhu/v1/vacancies')
    await page.getByRole('link', { name: 'Create vacancy' }).click()
    await page.getByRole('textbox', { name: 'Job title' }).fill('Editorial QA Engineer')
    await page.getByRole('textbox', { name: 'Vacancy URL key' }).fill(key)
    await page.getByRole('textbox', { name: 'Company name' }).fill('Editorial Fixture')
    await page.getByRole('textbox', { name: 'Company key' }).fill(key)
    await page.getByRole('textbox', { name: 'Country code' }).fill('GB')
    await page.getByRole('textbox', { name: 'Job description' }).fill('A fictional first-party vacancy for the operator rehearsal.')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({ path: testInfo.outputPath('operator-create-mobile.png'), fullPage: true })
    await page.getByRole('button', { name: 'Create draft' }).click()
    await expect(page.getByRole('dialog')).toContainText('Editorial QA Engineer')
    const [record] = await sql`select id, status,source_url from vacancies where slug=${key}`
    expect(record).toMatchObject({ status: 'DRAFT', source_url: null })
    await page.getByRole('checkbox', { name: /I checked the content/ }).check()
    await page.getByRole('button', { name: 'Verify & publish' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const row = page.getByRole('row').filter({ hasText: 'Editorial QA Engineer' })
    await row.getByRole('link', { name: 'Edit' }).click()
    const title = page.getByRole('textbox', { name: 'Job title' })
    await expect(title).toHaveValue('Editorial QA Engineer')
    await title.fill('Corrected editorial QA role')
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    await page.getByRole('checkbox', { name: /takes it offline/ }).check()
    await sql`update vacancies set title='Correction from another operator' where id=${record!.id}`
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'This vacancy changed.' })).toBeVisible()
    await page.getByRole('button', { name: 'Reload latest vacancy' }).click()
    await expect(title).toHaveValue('Correction from another operator')
    await title.fill('Corrected editorial QA role')
    await page.getByRole('checkbox', { name: /takes it offline/ }).check()
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
    await page.screenshot({ path: testInfo.outputPath('operator-correct-desktop.png'), fullPage: true })
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('dialog')).toContainText('Corrected editorial QA role')
    expect(await sql`select id,status,review_status from vacancies where slug=${key}`).toEqual([{ id: record!.id, status: 'DRAFT', review_status: 'UNREVIEWED' }])
  } finally {
    await sql`delete from vacancies where slug=${key}`
    await sql`delete from organisations where slug=${key}`
  }
})

test('operator endpoints enforce authorization, same origin, content types and limits', async ({ context }) => {
  await signIn(context, subject + 1, false)
  const endpoint = '/api/v1/admin/vacancies/file'
  const body = { mode: 'preview', csv: csv() }
  const editor = '/api/v1/admin/vacancies/editor'
  expect((await context.request.post(editor, { headers, data: {} })).status()).toBe(403)
  expect((await context.request.post(endpoint, { headers, data: body })).status()).toBe(403)
  await signIn(context, subject + 1)
  expect((await context.request.post(editor, { headers, data: {} })).status()).toBe(422)
  expect((await context.request.post(editor, { headers: { origin: 'https://other.invalid' }, data: {} })).status()).toBe(403)
  expect((await context.request.post(endpoint, { headers: { origin: 'https://attacker.invalid' }, data: body })).status()).toBe(403)
  expect((await context.request.post(endpoint, { headers: { ...headers, 'content-type': 'text/plain' }, data: 'not json' })).status()).toBe(415)
  expect((await context.request.post(endpoint, { headers: { ...headers, 'content-type': 'application/json' }, data: '{' })).status()).toBe(400)
  expect((await context.request.post(endpoint, { headers, data: { mode: 'preview', csv: 'x'.repeat(4 * 1024 * 1024) } })).status()).toBe(413)
  expect((await context.request.get(endpoint.replace('/file', ''))).headers()['cache-control']).toBe('no-store')
  expect((await context.request.patch('/api/v1/admin/vacancies/1', { headers, data: { status: 'PUBLISHED', reviewStatus: 'VERIFIED', revision: 'a'.repeat(64), reviewedByUserID: 1 } })).status()).toBe(400)
})

test('source endpoints are default-off and enforce current role, strict bounded input and same origin', async ({ context, page }) => {
  const user = await signIn(context, subject + 2, false)
  const endpoint = '/api/v1/admin/sources/run'
  const body = { action: 'FETCH', sourceKey: 'Lever:global:fixture-not-approved', runID: randomUUID() }
  expect((await context.request.get('/api/v1/admin/sources')).status()).toBe(403)
  expect((await context.request.post(endpoint, { headers, data: body })).status()).toBe(403)
  await signIn(context, subject + 2)
  const sources = await context.request.get('/api/v1/admin/sources')
  expect(sources.headers()['cache-control']).toBe('no-store')
  expect(await sources.json()).toEqual({ items: [] })
  expect((await context.request.post(endpoint, { headers, data: body })).status()).toBe(404)
  expect((await context.request.get('/api/v1/admin/sources/progress?sourceKey=Lever:global:fixture-not-approved')).status()).toBe(404)
  expect((await context.request.post(endpoint, { headers: { origin: 'https://attacker.invalid' }, data: body })).status()).toBe(403)
  expect((await context.request.post(endpoint, { headers, data: { ...body, url: 'https://attacker.invalid' } })).status()).toBe(400)
  expect((await context.request.post(endpoint, { headers, data: { ...body, extra: 'x'.repeat(4096) } })).status()).toBe(413)
  await page.goto('/ktulhu/v1/sources')
  await expect(page.getByText('No approved sources.', { exact: true })).toBeVisible()
  await sql`update users set role='USER' where id=${user.id}`
  expect((await context.request.get('/api/v1/admin/sources')).status()).toBe(403)
})

test('source operator UI retains contact exclusions when recovering a mixed import (mock transport only)', async ({ context, page }, testInfo) => {
  await signIn(context, subject + 3)
  const sourceKey = 'Lever:global:fictional-ui-fixture'
  const excludedId = '00000000-0000-4000-8000-000000000002'
  const report = { fetchedAt: '2026-10-27T00:00:00Z', pageCount: 1, recordCount: 2, created: 0, updated: 0, unchanged: 0, failure: null, issues: [] }
  const checkpoint = { sourceKey, nextOffset: 0, expiresAt: '2099-01-01T00:00:00Z', retryAfterAt: null }
  // Older reports have no contactSkippedIds; rejected records are not contact exclusions.
  let progress: object = { ...checkpoint, runID: randomUUID(), state: 'FAILED', report: { ...report, failure: 'INVALID_RECORDS', issues: [{ index: 1, id: null, code: 'INVALID_RECORD' }] } }
  let imported = 0
  async function expectCounts(processed: number, excluded: number) {
    for (const text of ['Scanned: 2', `Processed: ${processed}`, `Excluded by contact rule: ${excluded}`])
      await expect(page.getByText(text, { exact: true })).toBeVisible()
  }
  await page.route('**/api/v1/admin/sources', route => route.fulfill({ json: { items: [{ key: sourceKey, company: 'Fictional UI Fixture', approval: {} }] } }))
  await page.route('**/api/v1/admin/sources/progress?*', route => route.fulfill({ json: { progress } }))
  await page.route('**/api/v1/admin/sources/run', async (route) => {
    const command = route.request().postDataJSON()
    if (command.action === 'FETCH') {
      progress = { ...checkpoint, runID: command.runID, state: 'READY', report: { ...report, contactSkippedIds: [excludedId] } }
      return route.fulfill({ json: { progress } })
    }
    if (command.action === 'PREVIEW') return route.fulfill({ json: { progress, offset: 0, preview: { valid: true, rowCount: 1, issues: [], summary: { created: 1, updated: 0, unchanged: 0, withdrawnPublished: 0 }, revision: 'a'.repeat(64), rows: [{ row: 2, title: 'Fictional Source Engineer', company: 'Fictional UI Fixture', operation: 'CREATED' }] } } })
    imported++
    progress = { ...progress, state: 'IMPORTED', nextOffset: 1, report: { ...report, contactSkippedIds: [excludedId], created: 1 } }
    await route.abort('failed')
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto('/ktulhu/v1/sources')
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Fictional UI Fixture' }).click()
  await expect(page.getByRole('heading', { name: 'FAILED', exact: true })).toBeVisible()
  await expectCounts(0, 0)
  await page.getByRole('button', { name: 'Fetch source', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'READY', exact: true })).toBeVisible()
  await expectCounts(0, 1)
  await page.getByText('Excluded posting IDs', { exact: true }).press('Enter')
  await expect(page.getByRole('link', { name: excludedId })).toHaveAttribute('href', `/ktulhu/v1/vacancies?q=${excludedId}`)
  await page.getByRole('button', { name: 'Preview next batch', exact: true }).click()
  await expect(page.getByText('Fictional Source Engineer', { exact: false })).toBeVisible()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`source-preview-${width}.png`), fullPage: true })
  }
  await page.getByRole('button', { name: 'Confirm batch import', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'IMPORTED', exact: true })).toBeVisible()
  await expectCounts(1, 1)
  await expect(page.getByText(excludedId, { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm batch import', exact: true })).toHaveCount(0)
  await expect(page.getByText('Operation not confirmed', { exact: true })).toHaveCount(0)
  expect(imported).toBe(1)
  expect(errors).toEqual([])
})

test('operator can preview seven demo vacancies and cannot confirm a mixed-source file', async ({ page, context }) => {
  await signIn(context, randomInt(1_000_000_000, 1_000_000_000_000))
  const demo = execFileSync(process.execPath, [fileURLToPath(new URL('../../scripts/export-preview-vacancies.mjs', import.meta.url))], { env: {}, encoding: 'utf8' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ktulhu/v1/import')
  const file = page.getByLabel('Vacancy CSV file')
  await file.setInputFiles({ name: 'demo.csv', mimeType: 'text/csv', buffer: Buffer.from(demo) })
  await page.getByRole('button', { name: 'Validate file' }).click()
  await expect(page.getByRole('heading', { name: 'Import preview' })).toBeVisible()
  await expect(page.getByText('Senior Backend Engineer', { exact: true })).toBeVisible()
  await expect(page.getByText('Quality Engineer', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm import' })).toBeEnabled()
  const ordinary = csv()
  await file.setInputFiles({ name: 'mixed.csv', mimeType: 'text/csv', buffer: Buffer.from(demo + ordinary.slice(ordinary.indexOf('\n') + 1)) })
  await page.getByRole('button', { name: 'Validate file' }).click()
  await expect(page.getByText(/Import demo vacancies separately from other sources/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Confirm import' })).toHaveCount(0)
})
