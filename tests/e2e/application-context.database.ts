import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const slug = randomUUID()
const origin = 'http://127.0.0.1:3129'
let companyID: number, vacancyID: number, userID: number
test.beforeAll(async () => {
  const [company] = await sql`insert into organisations (name,slug,status) values ('Original Context Company',${slug},'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code) values (${companyID},${slug},'Context Engineer','Original duties','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','DE') returning id`
  vacancyID = vacancy!.id
})
test.afterAll(async () => {
  if (userID) await sql`delete from users where id=${userID}`
  await sql`delete from vacancies where id=${vacancyID}`
  await sql`delete from organisations where id=${companyID}`
  await sql.end()
})

test('a changed listing requires explicit renewed review, not a false duplicate or silent recipient switch', async ({ context, page }, testInfo) => {
  const login = await context.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(randomInt(1e9, 1e12), 'Context Candidate') } })
  expect(login.status()).toBe(200)
  userID = (await login.json()).user.id
  await context.request.put('/api/v1/profile', { headers: { origin }, data: { telegram: '@context_fixture' } })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/jobs/${slug}`)
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Cover note' }).fill('Keep my note while I review the changed listing.')
  await dialog.getByRole('checkbox').check()
  await sql`update organisations set name='Updated Context Company' where id=${companyID}`
  await sql`update vacancies set description='New duties requiring renewed review' where id=${vacancyID}`
  const failure = page.waitForResponse(response => response.url().endsWith(`/vacancies/${vacancyID}/applications`) && response.request().method() === 'POST')
  await dialog.getByRole('button', { name: 'Submit application', exact: true }).click()
  expect((await failure).status()).toBe(412)
  await expect(dialog.getByText(/This listing changed/)).toBeVisible()
  await expect(dialog.getByRole('checkbox')).not.toBeChecked()
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled()
  expect(await sql`select id from applications where user_id=${userID}`).toHaveLength(0)
  expect(await sql`select id from application_handling_events where actor_user_id=${userID}`).toHaveLength(0)
  await dialog.getByRole('button', { name: 'Reload listing', exact: true }).click()
  await expect(dialog.getByRole('checkbox')).toHaveAccessibleName(/Updated Context Company/)
  await expect(dialog.getByRole('checkbox')).not.toBeChecked()
  await expect(dialog.getByRole('textbox', { name: 'Cover note' })).toHaveValue('Keep my note while I review the changed listing.')
  await expect(dialog.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled()
  await page.screenshot({ path: testInfo.outputPath('renewed-context-mobile.png'), fullPage: true })
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Submit application', exact: true }).click()
  await expect(page.getByText('Application received by TalentBay', { exact: true })).toBeVisible()
  const [application] = await sql`select submission_snapshot from applications where user_id=${userID}`
  expect(application!.submission_snapshot.recipient.name).toBe('Updated Context Company')
  expect(application!.submission_snapshot.vacancy.contextRevision).toMatch(/^v1:[a-f0-9]{64}$/)
  const response = await context.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers: { origin }, data: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true } })
  expect(response.status()).toBe(400)
})
