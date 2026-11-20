import { randomInt, randomUUID } from 'node:crypto'
import { expect, test as base } from '@playwright/test'
import type { Locator, Page, Route } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch } from './support/telegram'

const origin = 'http://127.0.0.1:3129'
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
type Draft = { id: number; orgID: number; userID: number; slug: string; text: string; submissions: string[] }

function form(page: Page) {
  const dialog = page.getByRole('dialog')
  return {
    dialog, note: dialog.getByRole('textbox', { name: 'Cover note', exact: true }),
    consent: dialog.getByRole('checkbox', { name: /I ask TalentBay to contact/ }),
    submit: dialog.getByRole('button', { name: 'Submit application', exact: true }),
    reload: dialog.getByRole('button', { name: 'Reload listing', exact: true }),
  }
}

async function publish(orgID: number, slug: string, title: string) {
  const [vacancy] = await sql`insert into vacancies (organisation_id, slug, title, description, status, review_status, employment_type, workplace_type, country_code)
    values (${orgID}, ${slug}, ${title}, 'Synthetic duties', 'PUBLISHED', 'VERIFIED', 'FULL_TIME', 'REMOTE', 'GB') returning id`
  return Number(vacancy!.id)
}

const test = base.extend<{ draft: Draft }>({
  draft: async ({ page, baseURL }, use) => {
    expect(baseURL).toBe(origin)
    await page.context().route(url => url.origin !== origin, route => route.abort())
    const slug = `recovery-${randomUUID()}`
    const subject = randomInt(1e9, 1e12)
    const [org] = await sql`insert into organisations (name, slug, status) values ('Recovery fixture', ${slug}, 'ACTIVE') returning id`
    const orgID = Number(org!.id)
    try {
      const id = await publish(orgID, slug, 'Recovery engineer')
      const login = await page.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(subject, 'Recovery candidate') } })
      expect(login.status()).toBe(200)
      const userID = Number((await login.json()).user.id)
      expect((await page.request.put('/api/v1/profile', { headers: { origin }, data: { telegram: '@recovery_fixture' } })).status()).toBe(200)
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/jobs/${slug}`)
      await page.getByRole('button', { name: 'Apply', exact: true }).click()
      const { dialog, note, consent, submit } = form(page)
      await expect(dialog).toHaveAccessibleName('Apply for Recovery engineer')
      const text = `My original draft ${slug.slice(-8)}.`
      await note.fill(text)
      await consent.check()
      await expect(submit).toBeEnabled()
      const submissions: string[] = []
      page.on('request', req => {
        const path = new URL(req.url()).pathname
        if (req.method() === 'POST' && /^\/api\/v1\/vacancies\/\d+\/applications$/.test(path)) submissions.push(path)
      })
      await use({ id, orgID, userID, slug, text, submissions })
    }
    finally {
      await sql.begin(async tx => {
        await tx`delete from users where id in (select user_id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject)})`
        await tx`delete from vacancies where organisation_id=${orgID}`
        await tx`delete from organisations where id=${orgID}`
      })
    }
  },
})
test.afterAll(async () => { await sql.end() })

async function clickForResponse(page: Page, control: Locator, method: 'GET' | 'POST', path: string, status: number) {
  const [response] = await Promise.all([
    page.waitForResponse(res => res.request().method() === method && new URL(res.url()).pathname === path),
    control.click(),
  ])
  expect(response.status()).toBe(status)
  return response
}
const submitPath = (draft: Draft) => `/api/v1/vacancies/${draft.id}/applications`
const detailPath = (draft: Draft) => `/api/v1/vacancies/${draft.slug}`
const receipts = (draft: Draft) => sql`select vacancy_id, cover_letter, submission_snapshot from applications where user_id=${draft.userID}`

async function changed(page: Page, draft: Draft) {
  const { dialog, submit, consent, note } = form(page)
  await sql`update vacancies set title='Revised recovery engineer' where id=${draft.id}`
  const response = await clickForResponse(page, submit, 'POST', submitPath(draft), 412)
  await expect(dialog.getByText(/this listing changed/i)).toBeVisible()
  await expect(note).toHaveValue(draft.text)
  await expect(consent).not.toBeChecked()
  await expect(submit).toBeDisabled()
  expect(await receipts(draft)).toHaveLength(0)
  return response.request().postDataJSON().expectedContext as string
}

async function expectUnavailableAndExit(page: Page, draft: Draft) {
  const { dialog, note, reload } = form(page)
  const status = dialog.getByRole('status').filter({ hasText: 'Submission is no longer available for this application.' })
  await expect(dialog).toHaveAccessibleName('Application unavailable')
  await expect(status).toBeVisible()
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Application unavailable', exact: true }).click()
  await expect(dialog).toHaveAccessibleName('Application unavailable')
  await expect(status).toBeVisible()
  await expect(reload).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Submit application', disabled: false })).toHaveCount(0)
  // Exercise native selection, whether the terminal draft is a text field or rendered text.
  if (await note.isVisible()) {
    await expect(note).toHaveValue(draft.text)
    await note.focus()
    await expect(note).toBeFocused()
    await note.press('ControlOrMeta+a')
    expect(await note.evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(draft.text)
  } else {
    await dialog.getByText(draft.text, { exact: true }).click({ clickCount: 3 })
    expect(await page.evaluate(() => window.getSelection()?.toString().trim())).toBe(draft.text)
  }
  await dialog.getByRole('link', { name: 'Browse jobs', exact: true }).click()
  await expect(page).toHaveURL(`${origin}/jobs`)
  await expect(page.getByRole('search')).toBeVisible()
  await expect(dialog).toHaveCount(0)
  expect(draft.submissions).toEqual([submitPath(draft)])
  expect(await receipts(draft)).toHaveLength(0)
}

test('archived while Apply is open: a real 404 keeps a selectable note and exits without applying', async ({ page, draft }, info) => {
  await sql`update vacancies set status='ARCHIVED' where id=${draft.id}`
  await clickForResponse(page, form(page).submit, 'POST', submitPath(draft), 404)
  await expect(form(page).dialog).toHaveAccessibleName('Application unavailable')
  await page.screenshot({ path: info.outputPath('unavailable-apply-390.png'), animations: 'disabled' })
  await expectUnavailableAndExit(page, draft)
})

test('a failed reload after 412 keeps the draft blocked until fresh details and renewed consent', async ({ page, draft }) => {
  const { dialog, note, consent, submit, reload } = form(page)
  await sql`update organisations set name='Revised recovery company' where id=${draft.orgID}`
  const original = await changed(page, draft)
  const path = detailPath(draft)
  await page.route(url => url.origin === origin && url.pathname === path, route => route.fulfill({
    status: 503, contentType: 'application/json', body: JSON.stringify({ statusCode: 503, statusMessage: 'Temporary fixture failure' }),
  }), { times: 1 })
  await clickForResponse(page, reload, 'GET', path, 503)
  await expect(dialog.getByText(/could not be reloaded/i).first()).toBeVisible()
  await expect(page).toHaveURL(`${origin}/jobs/${draft.slug}`)
  await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toHaveCount(0)
  await expect(dialog.getByText(/no longer available/i)).toHaveCount(0)
  await expect(note).toHaveValue(draft.text)
  await expect(consent).not.toBeChecked()
  await expect(consent).toBeDisabled()
  await expect(submit).toBeDisabled()
  expect(await receipts(draft)).toHaveLength(0)

  const refreshed = await clickForResponse(page, reload, 'GET', path, 200)
  const { applicationContext } = await refreshed.json()
  expect(applicationContext).toMatch(/^v1:[a-f0-9]{64}$/)
  expect(applicationContext).not.toBe(original)
  await expect(dialog).toHaveAccessibleName('Apply for Revised recovery engineer')
  await expect(dialog.getByText(/could not be reloaded/i)).toHaveCount(0)
  await expect(consent).toHaveAccessibleName(/Revised recovery company/)
  await expect(note).toHaveValue(draft.text)
  await expect(consent).not.toBeChecked()
  await expect(submit).toBeDisabled()
  expect(draft.submissions).toEqual([submitPath(draft)])
  await consent.check()
  const accepted = await clickForResponse(page, submit, 'POST', submitPath(draft), 200)
  expect(accepted.request().postDataJSON()).toMatchObject({ expectedContext: applicationContext, shareAcknowledged: true, coverLetter: draft.text })
  await expect(page.getByText('Application received by TalentBay', { exact: true })).toBeVisible()
  expect(draft.submissions).toEqual([submitPath(draft), submitPath(draft)])
  expect(await receipts(draft)).toEqual([expect.objectContaining({
    vacancy_id: draft.id, cover_letter: draft.text,
    submission_snapshot: expect.objectContaining({ recipient: expect.objectContaining({ name: 'Revised recovery company' }), vacancy: expect.objectContaining({ contextRevision: applicationContext }) }),
  })])
})

test('a public replacement at the same slug cannot inherit a draft for the original vacancy', async ({ page, draft }) => {
  await changed(page, draft)
  await sql`update vacancies set slug=${`${draft.slug}-retired`}, status='ARCHIVED' where id=${draft.id}`
  const replacement = await publish(draft.orgID, draft.slug, 'Replacement engineer')
  expect(replacement).not.toBe(draft.id)
  const refreshed = await clickForResponse(page, form(page).reload, 'GET', detailPath(draft), 200)
  expect(await refreshed.json()).toMatchObject({ id: replacement, title: 'Replacement engineer' })
  await expectUnavailableAndExit(page, draft)
  await page.goto(`/jobs/${draft.slug}`)
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  const { dialog, note, consent, submit } = form(page)
  await expect(dialog).toHaveAccessibleName('Apply for Replacement engineer')
  await expect(note).toHaveValue('')
  await expect(consent).not.toBeChecked()
  await expect(submit).toBeDisabled()
  expect(await receipts(draft)).toHaveLength(0)
})

test.describe('stalled listing refresh', () => {
  test.beforeEach(async ({ page }) => { await page.clock.install() })

  test('the 15-second deadline returns to retry without submitting or losing the note', async ({ page, draft }) => {
    await changed(page, draft)
    const { dialog, note, consent, submit, reload } = form(page)
    const path = detailPath(draft)
    const retryMessage = dialog.getByText(/could not be reloaded/i)
    let park!: (route: Route) => void
    const held = new Promise<Route>(resolve => { park = resolve })
    await page.route(url => url.origin === origin && url.pathname === path, park, { times: 1 })
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
    await reload.press('Enter')
    const route = await held
    try {
      expect(route.request().method()).toBe('GET')
      await page.clock.fastForward(14_999)
      await expect(reload).toBeDisabled()
      await expect(retryMessage).toHaveCount(0)
      await page.clock.fastForward(1)
      await expect(retryMessage).toBeVisible()
      await expect(reload).toBeEnabled()
      await expect(note).toHaveValue(draft.text)
      await expect(consent).not.toBeChecked()
      await expect(submit).toBeDisabled()
    } finally {
      // Do not release the intercepted request until the client itself has handled the deadline.
      await route.abort()
    }
    await page.clock.resume()
    await clickForResponse(page, reload, 'GET', path, 200)
    await expect(dialog).toHaveAccessibleName('Apply for Revised recovery engineer')
    await expect(consent).not.toBeChecked()
    expect(draft.submissions).toEqual([submitPath(draft)])
    expect(await receipts(draft)).toHaveLength(0)
  })
})
