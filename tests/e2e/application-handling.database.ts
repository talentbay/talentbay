import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const origin = 'http://127.0.0.1:3129'
const suffix = randomUUID(), subject = randomInt(1_000_000_000, 1_000_000_000_000)
const users: number[] = []
let companyID: number, vacancyID: number, applicationID: number
async function login(context: BrowserContext, id: number, name: string) {
  const response = await context.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(id, name) } })
  expect(response.status()).toBe(200)
  const { user } = await response.json()
  users.push(user.id)
  return user
}
test.beforeAll(async () => {
  const [company] = await sql`insert into organisations (name,slug,status) values ('Handling Browser Company',${suffix},'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code) values (${companyID},${suffix},'Handling Browser Engineer','A fictional workflow role.','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','DE') returning id`
  vacancyID = vacancy!.id
})
test.afterAll(async () => {
  if (users.length) await sql`delete from users where id in ${sql([...new Set(users)])}`
  await sql`delete from vacancies where id=${vacancyID}`
  await sql`delete from organisations where id=${companyID}`
  await sql.end()
})

test('candidate → operator contact/package/manual handoff → candidate progress/withdrawal', async ({ browser }, testInfo) => {
  const candidate = await browser.newContext({ baseURL: origin })
  const operator = await browser.newContext({ baseURL: origin })
  try {
    await login(candidate, subject, 'Handling Browser Candidate')
    await candidate.request.put('/api/v1/profile', { headers: { origin }, data: { headline: 'Submitted headline', telegram: '@handling_browser' } })
    const receipt = await candidate.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers: { origin }, data: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, coverLetter: 'Submitted browser note.' } })
    expect(receipt.status()).toBe(200)
    applicationID = (await receipt.json()).id
    const admin = await login(operator, subject + 1, 'Handling Browser Operator')
    await sql`update users set role='ADMIN' where id=${admin.id}`
    await login(operator, subject + 1, 'Handling Browser Operator')
    const page = await operator.newPage()
    const runtimeErrors: string[] = []
    page.on('pageerror', error => runtimeErrors.push(error.message))
    page.on('console', message => { if (message.type() === 'error' && /TypeError|Unhandled|Uncaught|hydration|Failed to resolve/i.test(message.text())) runtimeErrors.push(message.text()) })
    await page.goto('/ktulhu/v1/applications?stage=RECEIVED')
    await page.getByRole('button', { name: 'Review Handling Browser Candidate for Handling Browser Engineer', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('combobox', { name: 'Transfer to operator', exact: true })).toBeVisible()
    await dialog.getByRole('button', { name: 'Take application', exact: true }).click()
    await expect(dialog.getByText('Assigned to you', { exact: true })).toBeVisible()
    await dialog.getByLabel('Private operator note').fill('Private handling browser note')
    await dialog.getByRole('button', { name: 'Record action', exact: true }).click()
    await expect(dialog.getByText('TalentBay is reviewing', { exact: true })).toBeVisible()
    await dialog.getByRole('combobox', { name: 'Next action' }).click()
    await page.getByRole('option', { name: 'Record company contact', exact: true }).click()
    await dialog.getByLabel('Private reference', { exact: true }).fill('Private company contact reference')
    await dialog.getByRole('button', { name: 'Record action', exact: true }).click()
    await expect(dialog.getByRole('combobox', { name: 'Next action' })).toBeEnabled()
    await expect(dialog.getByText('Company contact recorded', { exact: true }).first()).toBeVisible()
    await dialog.getByRole('combobox', { name: 'Next action' }).click()
    await page.getByRole('option', { name: 'Record completed handoff', exact: true }).click()
    await dialog.getByRole('button', { name: 'Prepare candidate package', exact: true }).click()
    await expect(dialog.getByRole('textbox', { name: 'Candidate package' })).toHaveValue(/@handling_browser/)
    expect(await sql`select id from application_handling_events where application_id=${applicationID} and kind='SHARED'`).toHaveLength(0)
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`handling-package-${width}.png`), fullPage: true })
    }
    await dialog.getByLabel('Private reference', { exact: true }).fill('Private recorded handoff reference')
    await dialog.getByRole('checkbox', { name: /I have already shared this exact package/ }).check()
    let dropped = false
    await page.route('**/api/v1/admin/applications/*/handling', async (route) => {
      if (!dropped && route.request().postDataJSON().action === 'SHARE') {
        dropped = true
        const response = await route.fetch()
        expect(response.status()).toBe(200)
        return route.fulfill({ status: 503, body: '{}' })
      }
      return route.continue()
    })
    await dialog.getByRole('button', { name: 'Record completed handoff', exact: true }).click()
    await expect(dialog.getByText('Action not confirmed', { exact: true })).toBeVisible()
    await expect(dialog.getByLabel('Private reference', { exact: true })).toHaveValue('Private recorded handoff reference')
    await dialog.getByRole('button', { name: 'Record completed handoff', exact: true }).click()
    await expect(dialog.getByText('A manual handoff was recorded. This is not proof of employer delivery, reading or a hiring decision.')).toBeVisible()
    expect(await sql`select id from application_handling_events where application_id=${applicationID} and kind='SHARED'`).toHaveLength(1)
    expect((await sql`select status from applications where id=${applicationID}`)[0]!.status).toBe('NEW')
    const progress = await candidate.request.get(`/api/v1/applications/${applicationID}/progress`)
    expect(progress.headers()['cache-control']).toBe('no-store')
    expect(await progress.text()).not.toMatch(/Private|actorUserID|assignedUserID|commandKey|commandDigest|channel|reference/)
    const view = await candidate.newPage()
    await view.setViewportSize({ width: 390, height: 844 })
    await view.goto('/applications')
    await view.getByRole('button', { name: 'View application for Handling Browser Engineer', exact: true }).click()
    const application = view.getByRole('dialog')
    await expect(application.getByText('TalentBay recorded a manual handoff', { exact: true })).toBeVisible()
    await expect(application.getByText(/This does not confirm delivery/)).toBeVisible()
    for (const width of [320, 390, 1440]) {
      await view.setViewportSize({ width, height: 900 })
      expect(await view.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await view.screenshot({ path: testInfo.outputPath(`candidate-recorded-handoff-${width}.png`), fullPage: true })
    }
    await application.getByRole('button', { name: 'Withdraw application', exact: true }).click()
    await application.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click()
    await expect(application).not.toBeVisible()
    expect((await operator.request.get(`/api/v1/admin/applications/${applicationID}/package`)).status()).toBe(409)
    expect((await sql`select status,handling_stage from applications where id=${applicationID}`)[0]).toEqual({ status: 'WITHDRAWN', handling_stage: 'CLOSED' })
    expect(runtimeErrors).toEqual([])
  } finally { await candidate.close(); await operator.close() }
})

test('new handling/progress endpoints enforce role, ownership, strict body and same origin', async ({ context }) => {
  const [owner] = await sql`insert into users (name) values ('Private progress owner fixture') returning id`
  users.push(owner!.id)
  const [application] = await sql`insert into applications (user_id,vacancy_id) values (${owner!.id},${vacancyID}) returning id`
  const applicationID = application!.id
  const endpoint = `/api/v1/admin/applications/${applicationID}/handling`
  expect((await context.request.post(endpoint, { headers: { origin }, data: {} })).status()).toBe(403)
  const other = await login(context, subject + 2, 'Other handling candidate')
  expect((await context.request.get(`/api/v1/applications/${applicationID}/progress`)).status()).toBe(404)
  expect((await context.request.get(`/api/v1/admin/applications/${applicationID}/package`)).status()).toBe(403)
  await sql`update users set role='ADMIN' where id=${other.id}`
  await login(context, subject + 2, 'Other handling candidate')
  const base = { action: 'START', commandKey: randomUUID(), expectedRevision: 1 }
  expect((await context.request.post(endpoint, { headers: { origin: 'https://attacker.invalid' }, data: base })).status()).toBe(403)
  expect((await context.request.post(endpoint, { headers: { origin }, data: { ...base, status: 'VIEWED' } })).status()).toBe(400)
  expect((await context.request.post(endpoint, { headers: { origin }, data: { ...base, padding: 'a'.repeat(12_001) } })).status()).toBe(413)
  await sql`update users set role='USER' where id=${other.id}`
  expect((await context.request.post(endpoint, { headers: { origin }, data: base })).status()).toBe(403)
})
