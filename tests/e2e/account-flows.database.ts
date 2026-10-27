import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const suffix = randomUUID()
const slug = `browser-vacancy-${suffix}`
const subject = randomInt(1_000_000_000, 1_000_000_000_000)
const userIDs: number[] = []
let vacancyID: number
let companyID: number

async function signIn(context: BrowserContext, id = subject) {
  const response = await context.request.post('/api/v1/auth/telegram', { headers: { origin: 'http://127.0.0.1:3129' }, data: { initData: signedLaunch(id) } })
  expect(response.status()).toBe(200)
  const { user } = await response.json()
  userIDs.push(user.id)
  return user
}

test.beforeAll(async () => {
  const [company] = await sql`insert into organisations (name, slug, status) values ('Browser Test Company', ${`browser-company-${suffix}`}, 'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id, slug, title, description, status, review_status, employment_type, workplace_type, country_code, city, published_at, source_name) values (${companyID}, ${slug}, 'Browser Test Engineer', 'A verified role for an isolated browser workflow test.', 'PUBLISHED', 'VERIFIED', 'FULL_TIME', 'REMOTE', 'DE', 'Berlin', now(), 'Browser workflow fixture') returning id`
  vacancyID = vacancy!.id
})
test.afterAll(async () => {
  await sql`delete from applications where vacancy_id = ${vacancyID}`
  await sql`delete from vacancies where id = ${vacancyID}`
  await sql`delete from organisations where id = ${companyID}`
  if (userIDs.length) await sql`delete from users where id in ${sql([...new Set(userIDs)])}`
  await sql.end()
})

test('real session → profile edit/retry → application list survives reload', async ({ page, context }, testInfo) => {
  const user = await signIn(context)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Browser Candidate' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Professional headline').fill('Principal TypeScript Engineer')
  await dialog.getByLabel('Country code').fill('DE')
  await dialog.getByLabel('City', { exact: true }).fill('Berlin')
  await dialog.getByLabel('About', { exact: true }).fill('My browser test profile.')
  await dialog.getByLabel('Telegram').fill('@browser_fixture')
  let attempts = 0
  await page.route('**/api/v1/profile', (route) => {
    if (route.request().method() === 'PUT' && ++attempts === 1) return route.fulfill({ status: 503, body: '{}' })
    return route.continue()
  })
  await dialog.getByRole('button', { name: 'Save profile' }).click()
  await expect(dialog.getByText('Save failed', { exact: true })).toBeVisible()
  await expect(dialog.getByLabel('Professional headline')).toHaveValue('Principal TypeScript Engineer')
  await dialog.getByRole('button', { name: 'Save profile' }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByText('Principal TypeScript Engineer', { exact: true })).toBeVisible()
  const [profile] = await sql`select headline, city from candidate_profiles where user_id = ${user.id}`
  expect(profile).toMatchObject({ headline: 'Principal TypeScript Engineer', city: 'Berlin' })
  await page.reload()
  await expect(page.getByText('Principal TypeScript Engineer', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('profile-mobile.png'), fullPage: true })

  await page.goto(`/jobs/${slug}`)
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(page.getByRole('dialog').getByText('Your current profile and cover note go to the TalentBay team, not directly to the employer. We contact the company to propose your candidacy.')).toBeVisible()
  const submit = page.getByRole('button', { name: 'Submit application' })
  await expect(submit).toBeDisabled()
  await expect(page.getByRole('dialog').getByText('@browser_fixture', { exact: true })).toBeVisible()
  await page.getByLabel('Cover note').fill('A real end-to-end cover note.')
  await page.getByRole('checkbox', { name: /I ask TalentBay to contact/ }).check()
  await expect(submit).toBeEnabled()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const titleBox = await page.getByRole('dialog').locator('[data-slot="title"]').boundingBox()
    const closeBox = await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).boundingBox()
    expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(closeBox!.x)
    await page.screenshot({ path: testInfo.outputPath(`application-preflight-${width}.png`), fullPage: true })
  }
  await page.getByRole('button', { name: 'Submit application' }).click()
  await expect(page.getByText('Application received by TalentBay', { exact: true })).toBeVisible()
  await expect(page.getByText('Our team will contact the company about your candidacy and follow up on next steps.', { exact: true })).toBeVisible()
  await page.goto('/applications')
  await expect(page.getByRole('heading', { name: 'Browser Test Engineer' })).toBeVisible()
  await expect(page.getByText('Received by TalentBay', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'View application for Browser Test Engineer' }).click()
  await expect(page.getByRole('dialog').getByText('A real end-to-end cover note.')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
  await page.reload()
  await expect(page.locator('article')).toHaveCount(1)
  await page.screenshot({ path: testInfo.outputPath('applications-mobile.png'), fullPage: true })
  expect(await sql`select id from applications where user_id = ${user.id} and vacancy_id = ${vacancyID}`).toHaveLength(1)
  const duplicate = await context.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers: { origin: 'http://127.0.0.1:3129' }, data: { coverLetter: 'Duplicate', disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true } })
  expect(duplicate.status()).toBe(409)
})

test('another account never reads the previous candidate data; cross-origin writes fail', async ({ page, context }) => {
  const user = await signIn(context, subject + 1)
  await page.goto('/profile')
  await expect(page.getByRole('button', { name: 'Edit profile', exact: true })).toBeVisible()
  await expect(page.getByText('Principal TypeScript Engineer', { exact: true })).toHaveCount(0)
  await page.goto('/applications')
  await expect(page.getByText('No applications yet', { exact: true })).toBeVisible()
  const blocked = await context.request.put('/api/v1/profile', { headers: { origin: 'https://attacker.invalid' }, data: { headline: 'Injected' } })
  expect(blocked.status()).toBe(403)
  expect(await sql`select * from candidate_profiles where user_id = ${user.id}`).toHaveLength(0)
  const admin = await context.request.get('/api/v1/admin/dashboard')
  expect(admin.status()).toBe(403)
})

test('Telegram host uses the same routes, a validated session, theme and native back action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(({ initData }) => {
    const callbacks: Record<string, () => void> = {}
    Object.assign(window, { __hostCallbacks: callbacks, __hostBackVisible: false })
    window.Telegram = { WebApp: {
      initData, colorScheme: 'dark', ready: () => {}, expand: () => {},
      safeAreaInset: { top: 20, bottom: 10, left: 0, right: 0 }, contentSafeAreaInset: { top: 40, bottom: 0, left: 0, right: 0 },
      onEvent: (name, callback) => { callbacks[name] = callback }, offEvent: () => {},
      BackButton: { onClick: callback => { callbacks.back = callback }, offClick: () => {}, show: () => { Object.assign(window, { __hostBackVisible: true }) }, hide: () => { Object.assign(window, { __hostBackVisible: false }) } },
      HapticFeedback: { selectionChanged: () => {}, notificationOccurred: () => {} },
    } }
  }, { initData: signedLaunch(subject + 2, 'Telegram Browser Candidate') })
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Telegram Browser Candidate' })).toBeVisible()
  const session = await (await page.request.get('/api/_auth/session')).json()
  userIDs.push(session.user.id)
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--host-safe-top'))).toBe('60px')
  await page.getByRole('link', { name: 'Settings', exact: true }).or(page.getByRole('button', { name: 'Settings', exact: true })).click()
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Haptic feedback' })).toBeVisible()
  await page.evaluate(() => {
    window.Telegram!.WebApp!.colorScheme = 'light'
    ;(window as unknown as { __hostCallbacks: Record<string, () => void> }).__hostCallbacks.themeChanged!()
  })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('combobox', { name: 'Theme', exact: true }).click()
  await page.getByRole('option', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.evaluate(() => (window as unknown as { __hostCallbacks: Record<string, () => void> }).__hostCallbacks.themeChanged!())
  await expect(page.locator('html')).toHaveClass(/dark/)
  expect(await page.evaluate(() => localStorage.getItem('talentbay:theme'))).toBe('dark')
  await page.getByRole('combobox', { name: 'Theme', exact: true }).click()
  await page.getByRole('option', { name: 'Host / system', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  expect(await page.evaluate(() => localStorage.getItem('talentbay:theme'))).toBe('system')
  expect(await page.evaluate(() => (window as unknown as { __hostBackVisible: boolean }).__hostBackVisible)).toBe(true)
  await page.evaluate(() => (window as unknown as { __hostCallbacks: Record<string, () => void> }).__hostCallbacks.back!())
  await expect(page).toHaveURL(/\/profile$/)
})

test('a signed Telegram job deep link uses the public vacancy route without a second app', async ({ page }) => {
  await page.addInitScript(({ initData }) => {
    window.Telegram = { WebApp: { initData, ready: () => { throw new Error('Old host method') } } }
  }, { initData: signedLaunch(subject + 3, 'Deep Link Candidate', `job_${slug}`) })
  await page.goto('/jobs')
  await expect(page).toHaveURL(new RegExp(`/jobs/${slug}$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Browser Test Engineer')
  const session = await (await page.request.get('/api/_auth/session')).json()
  userIDs.push(session.user.id)
})

test('relocation annualizes monthly salaries but never invents a currency conversion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await sql`update vacancies set salary_min = 4000, salary_max = 6000, salary_currency = 'EUR', salary_period = 'MONTH' where id = ${vacancyID}`
  try {
    await page.goto(`/jobs/${slug}`)
    await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('spinbutton', { name: 'Annual gross salary' })).toHaveValue('60000')
    await expect(dialog.getByRole('region', { name: 'Disposable income' })).toBeVisible()
    await dialog.getByRole('spinbutton', { name: 'Annual gross salary' }).fill('70000')
    await expect(dialog.getByRole('region', { name: 'Disposable income' })).toContainText('€1,517')
    await dialog.getByRole('spinbutton', { name: 'Annual gross salary' }).fill('0')
    await expect(dialog.getByRole('region', { name: 'Disposable income' })).toContainText('-€2,450')
    await dialog.getByRole('spinbutton', { name: 'Annual gross salary' }).fill('70000')
    await expect(dialog.getByRole('region', { name: 'Disposable income' })).toContainText('€1,517')
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
    await expect(dialog.getByRole('spinbutton', { name: 'Annual gross salary' })).toHaveValue('70000')
    await sql`update vacancies set salary_currency = 'USD' where id = ${vacancyID}`
    await page.reload()
    await page.getByRole('button', { name: 'Relocation estimate', exact: true }).click()
    await expect(dialog.getByRole('spinbutton', { name: 'Annual gross salary' })).toHaveValue('')
    await expect(dialog.getByText('Choose a destination and enter a yearly income in its currency to see an estimate.')).toBeVisible()
    await expect(dialog.getByRole('region', { name: 'Disposable income' })).toHaveCount(0)
    const invalid = await page.request.get('/api/v1/relocation/preview?location=berlin&annualGross=-1')
    expect(invalid.status()).toBe(400)
  }
  finally { await sql`update vacancies set salary_min = null, salary_max = null, salary_currency = null, salary_period = null where id = ${vacancyID}` }
})

test('authenticated profile, applications and vacancy remain usable at every target width', async ({ page, context }, testInfo) => {
  await signIn(context, subject + 5)
  const profile = await context.request.put('/api/v1/profile', { headers: { origin: 'http://127.0.0.1:3129' }, data: { headline: 'SeniorSoftwareArchitectureAndPlatformEngineering'.repeat(3), city: 'Berlin', countryCode: 'DE', telegram: '@browser_fixture' } })
  expect(profile.status()).toBe(200)
  const application = await context.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers: { origin: 'http://127.0.0.1:3129' }, data: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true } })
  expect(application.status()).toBe(200)
  for (const width of [320, 390, 768, 900, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/profile', '/applications', `/jobs/${slug}`]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (path === '/profile') await expect(page.getByRole('button', { name: 'Edit profile', exact: true })).toBeVisible()
      if (path === '/applications') await expect(page.locator('article')).toHaveCount(1)
      if (path.startsWith('/jobs/')) await expect(page.getByRole('link', { name: 'View application', exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${path.split('/')[1]}-${width}.png`), fullPage: true })
    }
  }
})

test('first-time profile completion returns to the same Apply with its in-memory cover note', async ({ page, context }) => {
  await signIn(context, subject + 4)
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(`/jobs/${slug}`)
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(page.getByText('Add a contact to your profile', { exact: true })).toBeVisible()
  await page.getByLabel('Cover note', { exact: true }).fill('A first-time candidate note kept on this vacancy.')
  await expect(page.getByRole('button', { name: 'Submit application', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Review your profile', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Edit profile', exact: true })
  await editor.getByLabel('Professional headline').fill('First-time Engineer')
  await editor.getByLabel('Telegram', { exact: true }).fill('@first_time_fixture')
  let attempts = 0
  await page.route('**/api/v1/profile', route => route.request().method() === 'PUT' && ++attempts === 1 ? route.fulfill({ status: 503, body: '{}' }) : route.continue())
  await editor.getByRole('button', { name: 'Save profile', exact: true }).click()
  await expect(editor.getByText('Save failed', { exact: true })).toBeVisible()
  await expect(editor.getByLabel('Telegram', { exact: true })).toHaveValue('@first_time_fixture')
  await editor.getByRole('button', { name: 'Save profile', exact: true }).click()
  await expect(editor).not.toBeVisible()
  const apply = page.getByRole('dialog', { name: 'Apply for Browser Test Engineer', exact: true })
  await expect(apply.getByText('@first_time_fixture', { exact: true })).toBeVisible()
  await expect(apply.getByLabel('Cover note', { exact: true })).toHaveValue('A first-time candidate note kept on this vacancy.')
  await expect(page).toHaveURL(new RegExp(`/jobs/${slug}$`))
  await apply.getByRole('checkbox', { name: /I ask TalentBay to contact/ }).check()
  await apply.getByRole('button', { name: 'Submit application', exact: true }).click()
  await expect(page.getByText('Application received by TalentBay', { exact: true })).toBeVisible()
})

test('session expiry clears the private draft and offers sign-in on the same vacancy', async ({ page, context }) => {
  await signIn(context, subject + 6)
  await context.request.put('/api/v1/profile', { headers: { origin: 'http://127.0.0.1:3129' }, data: { telegram: '@expired_fixture' } })
  await page.goto(`/jobs/${slug}`)
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await page.getByLabel('Cover note', { exact: true }).fill('Private expired-session note')
  await page.getByRole('checkbox', { name: /I ask TalentBay to contact/ }).check()
  await context.request.delete('/api/_auth/session')
  await page.getByRole('button', { name: 'Submit application', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sign in again to apply', exact: true })).toBeVisible()
  await expect(page.getByText(/For privacy, the previous cover note was cleared/)).toBeVisible()
  await expect(page.getByText('Private expired-session note', { exact: true })).toHaveCount(0)
  await expect(page).toHaveURL(new RegExp(`/jobs/${slug}$`))
})
