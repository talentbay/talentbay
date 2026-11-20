import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { getApplicationPreconditions, getCandidateContext, setFixtureProfile } from './support/application'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const suffix = randomUUID()
const subject = randomInt(1_000_000_000, 1_000_000_000_000)
const users: number[] = []
const origin = 'http://127.0.0.1:3129'
let companyID: number, vacancyID: number, applicationID: number
async function login(context: BrowserContext, id: number, name: string) {
  const response = await context.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(id, name) } })
  expect(response.status()).toBe(200)
  const { user } = await response.json()
  users.push(user.id)
  return user
}
async function operator(context: BrowserContext) {
  const user = await login(context, subject + 1, 'Application Operator')
  await sql`update users set role = 'ADMIN' where id = ${user.id}`
  await login(context, subject + 1, 'Application Operator')
  return user
}
test.beforeAll(async () => {
  const [company] = await sql`insert into organisations (name, slug, status) values ('Application Review Fixture', ${suffix}, 'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id, slug, title, description, status, review_status, employment_type, workplace_type, country_code, source_name) values (${companyID}, ${suffix}, 'Review Test Engineer', 'Synthetic test role.', 'PUBLISHED', 'VERIFIED', 'FULL_TIME', 'REMOTE', 'DE', 'Review browser fixture') returning id`
  vacancyID = vacancy!.id
})
test.afterAll(async () => {
  if (users.length) await sql`delete from users where id in ${sql([...new Set(users)])}`
  await sql`delete from vacancies where id = ${vacancyID}`
  await sql`delete from organisations where id = ${companyID}`
  await sql.end()
})

test('application APIs enforce current admin role, ownership, origin and bounded strict input', async ({ context, browser }) => {
  expect((await context.request.get('/api/v1/admin/applications')).status()).toBe(403)
  expect((await context.request.post('/api/v1/applications/1/withdraw', { headers: { origin }, data: {} })).status()).toBe(401)
  const candidate = await login(context, subject, 'Review Test Candidate')
  const applyUrl = `/api/v1/vacancies/${vacancyID}/applications`
  const { expectedContext, expectedCandidateContext } = await getApplicationPreconditions(context.request, suffix)
  const notice = { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, expectedContext }
  const acknowledgment = { ...notice, expectedCandidateContext }
  expect((await context.request.post(applyUrl, { headers: { origin }, data: acknowledgment })).status()).toBe(422)
  expect((await context.request.post(applyUrl, { headers: { origin }, data: {} })).status()).toBe(400)
  expect((await context.request.post(applyUrl, { headers: { origin }, data: { ...acknowledgment, userID: candidate.id } })).status()).toBe(400)
  expect((await context.request.post(applyUrl, { headers: { origin }, data: { ...acknowledgment, shareAcknowledged: false } })).status()).toBe(400)
  expect((await context.request.post(applyUrl, { headers: { origin }, data: { coverLetter: 'x'.repeat(24_001) } })).status()).toBe(413)
  expect((await context.request.post(applyUrl, { headers: { origin: 'https://attacker.invalid' }, data: acknowledgment })).status()).toBe(403)
  expect(await sql`select id from applications where user_id=${candidate.id}`).toHaveLength(0)
  await setFixtureProfile(context.request, candidate.id, { telegram: '@review_fixture' })
  expect((await context.request.post(applyUrl, { headers: { origin }, data: notice })).status()).toBe(400)
  const response = await context.request.post(applyUrl, { headers: { origin }, data: { coverLetter: 'Review browser cover note.', ...notice, expectedCandidateContext: await getCandidateContext(context.request) } })
  expect(response.status()).toBe(200)
  applicationID = (await response.json()).id
  expect((await context.request.get(`/api/v1/admin/applications/${applicationID}`)).status()).toBe(403)
  const other = await browser.newContext({ baseURL: origin })
  try {
    await login(other, subject + 2, 'Other Review Candidate')
    expect((await other.request.post(`/api/v1/applications/${applicationID}/withdraw`, { headers: { origin }, data: {} })).status()).toBe(404)
  } finally { await other.close() }
  const admin = await browser.newContext({ baseURL: origin })
  try {
    const user = await operator(admin)
    const detail = await admin.request.get(`/api/v1/admin/applications/${applicationID}`)
    expect(detail.headers()['cache-control']).toBe('no-store')
    expect((await detail.json()).candidate.user.id).toBe(candidate.id)
    expect((await admin.request.get('/api/v1/admin/applications?before=bad')).status()).toBe(400)
    expect((await admin.request.get('/api/v1/admin/applications/nope')).status()).toBe(400)
    // Operators cannot reinterpret employer status or send an application in this slice.
    expect((await admin.request.post(`/api/v1/admin/applications/${applicationID}/review`, { headers: { origin }, data: {} })).status()).toBe(404)
    await sql`update users set role = 'USER' where id = ${user.id}`
    expect((await admin.request.get(`/api/v1/admin/applications/${applicationID}`)).status()).toBe(403)
  } finally { await admin.close() }
  expect((await context.request.post(`/api/v1/applications/${applicationID}/withdraw`, { headers: { origin: 'https://attacker.invalid' }, data: {} })).status()).toBe(403)
  expect((await context.request.post(`/api/v1/applications/${applicationID}/withdraw`, { headers: { origin }, data: { userID: candidate.id } })).status()).toBe(400)
  expect((await context.request.post(`/api/v1/applications/${applicationID}/withdraw`, { headers: { origin }, data: { padding: 'x'.repeat(600) } })).status()).toBe(413)
  expect((await sql`select status from applications where id = ${applicationID}`)[0]!.status).toBe('NEW')
})

test('operator can inspect without employer progress; candidate can withdraw with retry', async ({ browser }, testInfo) => {
  const admin = await browser.newContext({ baseURL: origin })
  const candidate = await browser.newContext({ baseURL: origin })
  try {
    await operator(admin)
    const page = await admin.newPage()
    await page.goto('/ktulhu/v1/applications?status=NEW')
    await page.getByRole('button', { name: 'Review Review Test Candidate for Review Test Engineer', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Review browser cover note.', { exact: true })).toBeVisible()
    await expect(dialog).toHaveCSS('opacity', '1')
    expect((await sql`select status from applications where id = ${applicationID}`)[0]!.status).toBe('NEW')
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.screenshot({ path: testInfo.outputPath(`operator-${width}.png`), fullPage: true })
      const overflow = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth,
        roots: [document.documentElement, document.body, document.querySelector('#__nuxt')!].map(el => ({ tag: el.tagName, style: el.getAttribute('style'), rect: el.getBoundingClientRect().toJSON(), paddingRight: getComputedStyle(el).paddingRight, width: getComputedStyle(el).width, overflow: getComputedStyle(el).overflow })),
        dialog: [...document.querySelectorAll('[role="dialog"]')].map(el => ({ class: el.className, rect: el.getBoundingClientRect().toJSON(), cssWidth: getComputedStyle(el).width, minWidth: getComputedStyle(el).minWidth })),
        elements: [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0 }).slice(0, 8).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.slice(0, 80) })),
      }))
      expect(overflow.document, JSON.stringify(overflow)).toBeLessThanOrEqual(width)
    }
    await page.screenshot({ path: testInfo.outputPath('operator-application.png'), fullPage: true })
    await expect(dialog.getByRole('button', { name: 'Mark reviewed by TalentBay', exact: true })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await login(candidate, subject, 'Review Test Candidate')
    const view = await candidate.newPage()
    await view.setViewportSize({ width: 390, height: 844 })
    await view.goto('/applications')
    await expect(view.getByText('Received by TalentBay', { exact: true })).toBeVisible()
    await view.getByRole('button', { name: 'View application for Review Test Engineer', exact: true }).click()
    const application = view.getByRole('dialog')
    await application.getByRole('button', { name: 'Withdraw application', exact: true }).click()
    await application.getByRole('button', { name: 'Keep application', exact: true }).click()
    expect((await sql`select status from applications where id = ${applicationID}`)[0]!.status).toBe('NEW')
    let attempts = 0
    await view.route('**/api/v1/applications/*/withdraw', route => ++attempts === 1 ? route.fulfill({ status: 503, body: '{}' }) : route.continue())
    await application.getByRole('button', { name: 'Withdraw application', exact: true }).click()
    await application.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click()
    await expect(application.getByText('Not withdrawn', { exact: true })).toBeVisible()
    await view.screenshot({ path: testInfo.outputPath('withdrawal-retry-mobile.png'), fullPage: true })
    await application.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click()
    await expect(application).not.toBeVisible()
    await view.reload()
    await expect(view.getByText('Withdrawn', { exact: true })).toBeVisible()
    expect((await sql`select status from applications where id = ${applicationID}`)[0]!.status).toBe('WITHDRAWN')
    expect((await (await admin.request.get(`/api/v1/admin/applications/${applicationID}`)).json()).status).toBe('WITHDRAWN')
    await view.screenshot({ path: testInfo.outputPath('withdrawn-mobile.png'), fullPage: true })
  } finally { await candidate.close(); await admin.close() }
})
