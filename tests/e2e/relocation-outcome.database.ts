import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import example from '../../docs/examples/relocation-synthetic.v1.json' with { type: 'json' }
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const marker = `Relocation Outcome ${randomUUID()}`
const slug = `relocation-outcome-${randomUUID()}`
const reviewedAt = new Date().toISOString()
let companyID: number, locationID: number
const userIDs: number[] = []
test.beforeAll(async () => {
  const record = { ...structuredClone(example.records[0]!), status: 'VERIFIED', review: { at: reviewedAt, by: `${marker} private reviewer`, reference: `${marker} private review reference`, validUntil: '2099-12-31' } }
  const sources = record.sources.map(({ covers: _covers, ...source }) => source)
  const [location] = await sql`insert into relocation_locations(country_code,city,currency,status,monthly_costs,one_time_costs,tax_model,sources,effective_from,reviewed_at,dataset_snapshot,notes)
    values('GB','London','GBP','VERIFIED',${sql.json(record.monthlyCosts)},${sql.json(record.oneTimeCosts)},${sql.json(record.taxModel)},${sql.json(sources)},'2026-01-01T00:00:00Z',${reviewedAt},${sql.json({ schemaVersion: 1, purpose: 'PILOT', record })},${marker}) returning id`
  locationID = location!.id
  const [company] = await sql`insert into organisations(name,slug,status) values(${marker},${slug},'ACTIVE') returning id`
  companyID = company!.id
  for (const city of ['London', 'Dubai']) {
    await sql`insert into vacancies(organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code,city,salary_min,salary_max,salary_currency,salary_period,source_name)
      values(${companyID},${`${slug}-${city.toLowerCase()}`},${`Fictional ${city} Engineer`},'Fictional browser fixture, not an active vacancy.','PUBLISHED','VERIFIED','FULL_TIME','ONSITE',${city === 'London' ? 'GB' : 'AE'},${city},60000,60000,${city === 'London' ? 'GBP' : 'AED'},'YEAR',${marker})`
  }
})
test.afterAll(async () => {
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  if (locationID) await sql`delete from relocation_locations where id=${locationID}`
  if (userIDs.length) await sql`delete from users where id in ${sql(userIDs)}`
  await sql.end()
})

test('real SQL/API sources and assumptions appear without private review identity on every responsive composition', async ({ page, request }, testInfo) => {
  const payload = await (await request.get(`/api/v1/relocation/preview?location=location-${locationID}&annualGross=60000`)).json()
  expect(payload).toMatchObject({ details: { annualTax: 12000, monthlyCosts: example.records[0]!.monthlyCosts, oneTimeCosts: example.records[0]!.oneTimeCosts }, provenance: { validUntil: '2099-12-31', assumptions: example.records[0]!.assumptions } })
  expect(JSON.stringify(payload)).not.toContain(marker)
  for (const width of [320, 390, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`/jobs/${slug}-london`)
    if (width < 1024) {
      await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
      const dialog = page.getByRole('dialog')
      const description = await dialog.locator('[data-slot="description"]').boundingBox()
      const close = await dialog.getByRole('button', { name: 'Close', exact: true }).boundingBox()
      const header = await dialog.locator('[data-slot="header"]').boundingBox()
      expect(description!.x + description!.width).toBeLessThanOrEqual(close!.x)
      expect(description!.y + description!.height).toBeLessThanOrEqual(header!.y + header!.height)
      if (width === 320) await page.screenshot({ path: testInfo.outputPath('relocation-reviewed-top-320.png'), animations: 'disabled' })
    }
    const tool = page.getByRole('complementary', { name: 'Relocation preview', exact: true }).filter({ visible: true })
    await expect(tool.getByText('Reviewed data', { exact: true })).toBeVisible()
    await expect(tool.getByRole('region', { name: 'Disposable income' })).toContainText('£2,500')
    await tool.getByText('Living cost details', { exact: true }).press('Enter')
    await expect(tool.getByText('Utilities', { exact: true })).toBeVisible()
    await tool.getByText('Moving budget details', { exact: true }).press('Enter')
    await expect(tool.getByText('Deposit', { exact: true })).toBeVisible()
    await tool.getByText('Data and assumptions', { exact: true }).press('Enter')
    await expect(tool.getByText(example.records[0]!.assumptions.taxResidency, { exact: true })).toBeVisible()
    await expect(tool.getByText('Dec 31, 2099 UTC', { exact: true })).toBeVisible()
    await expect(tool.getByRole('link', { name: example.records[0]!.sources[0]!.label })).toHaveAttribute('href', example.records[0]!.sources[0]!.url)
    await expect(tool.getByText('Accessed Jan 1, 2026', { exact: true })).toBeVisible()
    await tool.getByText('Accessed Jan 1, 2026', { exact: true }).scrollIntoViewIfNeeded()
    expect(await tool.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath(`relocation-reviewed-${width}.png`), fullPage: true })
  }
  const tool = page.getByRole('complementary', { name: 'Relocation preview', exact: true })
  const income = tool.getByRole('spinbutton', { name: 'Annual gross salary' })
  await income.fill('2000000')
  await expect(tool.getByRole('region', { name: 'Disposable income' })).toContainText('£131,833')
  expect(await tool.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await sql`update relocation_locations set status='STALE' where id=${locationID}`
  await income.fill('61000')
  await expect(tool.getByText('The estimate could not be loaded.')).toBeVisible()
  await tool.getByRole('button', { name: 'Refresh destinations', exact: true }).click()
  await expect(income).toHaveValue('')
  await expect(tool.getByText('Demo data', { exact: true })).toBeVisible()
  await expect(tool.getByRole('region', { name: 'Disposable income' })).toHaveCount(0)
  await expect(tool.getByRole('status')).toContainText('Reviewed data changed.')
})

test('signing out resets an earlier account estimate before its vacancy is reopened', async ({ page, context }) => {
  await sql`update relocation_locations set status='VERIFIED' where id=${locationID}`
  const auth = await context.request.post('/api/v1/auth/telegram', { headers: { origin: 'http://127.0.0.1:3129' }, data: { initData: signedLaunch(randomInt(1_000_000_000, 1_000_000_000_000)) } })
  expect(auth.status()).toBe(200)
  userIDs.push((await auth.json()).user.id)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(`/jobs/${slug}-london`)
  const income = page.getByRole('spinbutton', { name: 'Annual gross salary' })
  await income.fill('120000')
  await expect(page.getByRole('region', { name: 'Disposable income' })).toContainText('£6,500')
  await page.getByRole('navigation', { name: 'Candidate navigation' }).getByRole('link', { name: 'Profile', exact: true }).click()
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Candidate navigation' }).getByRole('link', { name: 'Jobs', exact: true }).click()
  await page.getByRole('link', { name: 'Fictional London Engineer', exact: true }).click()
  await expect(income).toHaveValue('60000')
  await expect(page.getByRole('region', { name: 'Disposable income' })).toContainText('£2,500')
})

test('known pilot destination without data stays in vacancy context without a fabricated calculation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  let calls = 0
  page.on('request', request => { if (request.url().includes('/relocation/preview?')) calls++ })
  await page.goto(`/jobs/${slug}-dubai`)
  await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('No reviewed estimate for Dubai is available.', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('spinbutton')).toHaveCount(0)
  await expect(dialog.getByRole('region', { name: 'Disposable income' })).toHaveCount(0)
  expect(calls).toBe(0)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Fictional Dubai Engineer', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in to apply', exact: true })).toBeEnabled()
})
