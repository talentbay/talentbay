import { randomInt, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test as base } from '@playwright/test'
import type { APIRequestContext, Page, Request, Response } from '@playwright/test'
import postgres from 'postgres'
import { getApplicationPreconditions, setFixtureProfile } from './support/application'
import { signedLaunch } from './support/telegram'

const origin = 'http://127.0.0.1:3129'
const headers = { origin }
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const note = 'Private first-candidate cover note.'
const oldContact = '@first_review_contact', newContact = '@revised_review_contact'
type Review = { slug: string; id: number; owner: number; otherSubject: number; path: string; posts: Request[] }

async function login(request: APIRequestContext, subject: number, name: string) {
  const res = await request.post('/api/v1/auth/telegram', { headers, data: { initData: signedLaunch(subject, name) } })
  expect(res.status()).toBe(200)
  return Number((await res.json()).user.id)
}

function form(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Apply for Profile review engineer', exact: true })
  return { dialog, cover: dialog.getByRole('textbox', { name: 'Cover note' }), consent: dialog.getByRole('checkbox'),
    submit: dialog.getByRole('button', { name: 'Submit application', exact: true }) }
}

const test = base.extend<{ review: Review; startWithConsent: boolean }>({
  startWithConsent: [true, { option: true }],
  review: async ({ context, page, baseURL, startWithConsent }, use) => {
    expect(baseURL).toBe(origin)
    await context.route(url => url.origin !== origin, route => route.abort())
    const slug = `profile-review-${randomUUID()}`, subject = randomInt(1e9, 1e12)
    const [org] = await sql`insert into organisations (slug,name,status) values (${slug},'Review fixture','ACTIVE') returning id`
    try {
      const [job] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code)
        values (${org!.id},${slug},'Profile review engineer','Synthetic review duties','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB') returning id`
      const owner = await login(context.request, subject, 'First review candidate')
      await setFixtureProfile(context.request, owner, { telegram: oldContact, phone: '+1 202 555 0148', headline: 'Original review headline' })
      const path = `/api/v1/vacancies/${job!.id}/applications`, posts: Request[] = []
      page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === path) posts.push(req) })
      await page.goto(`/jobs/${slug}`)
      if (startWithConsent) {
        await page.getByRole('button', { name: 'Apply', exact: true }).click()
        const { dialog, cover, consent, submit } = form(page)
        await expect(dialog.getByText(oldContact, { exact: true })).toBeVisible()
        await cover.fill(note)
        await consent.check()
        await expect(submit).toBeEnabled()
      }
      await use({ slug, id: Number(job!.id), owner, otherSubject: subject + 1, path, posts })
    } finally {
      await sql.begin(async tx => {
        await tx`delete from users where id in (select user_id from oauth_accounts where provider='TELEGRAM' and provider_account_id in (${String(subject)},${String(subject + 1)}))`
        await tx`delete from vacancies where organisation_id=${org!.id}`
        await tx`delete from organisations where id=${org!.id}`
      })
    }
  },
})
test.afterAll(async () => { await sql.end() })

async function submitForm(page: Page, review: Review) {
  const [res] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === review.path && r.request().method() === 'POST'),
    form(page).submit.click(),
  ])
  return res
}

async function expectMismatch(res: Response) {
  expect(res.status()).toBe(412)
  expect(res.headers()['cache-control']).toContain('no-store')
  const body = await res.json()
  expect(body).toMatchObject({ code: 'CANDIDATE_REVIEW_REQUIRED', statusCode: 412 })
  for (const privateValue of [oldContact, newContact, note, 'v1:', 'First review candidate', 'Second review candidate']) {
    expect(JSON.stringify(body)).not.toContain(privateValue)
  }
}

async function expectNoWrite(review: Review, users = [review.owner]) {
  expect(await sql`select id from applications where vacancy_id=${review.id} or user_id in ${sql(users)}`).toHaveLength(0)
  expect(await sql`select id from application_handling_events where actor_user_id in ${sql(users)}`).toHaveLength(0)
}

async function editInOtherTab(tab: Page) {
  await tab.goto('/profile')
  await tab.getByRole('button', { name: 'Edit profile', exact: true }).click()
  const editor = tab.getByRole('dialog', { name: 'Edit profile', exact: true })
  await editor.getByLabel('Telegram', { exact: true }).fill(newContact)
  await editor.getByLabel('Professional headline').fill('Revised review headline')
  await editor.getByRole('button', { name: 'Save profile', exact: true }).click()
  await expect(editor).not.toBeVisible()
  const res = await tab.request.get('/api/v1/profile')
  expect(res.status()).toBe(200)
  const refreshed = await res.json()
  expect(refreshed.profile).toMatchObject({ telegram: newContact, headline: 'Revised review headline' })
  expect(refreshed.candidateContext).toMatch(/^v1:[a-f0-9]{64}$/)
  return refreshed
}

for (const failedRead of [null, 'private profile', 'session'] as const) {
  test(`cross-tab contact edit requires fresh consent${failedRead ? ` after a temporary ${failedRead} read failure` : ''}`, async ({ page, context, review }) => {
    const original = await getApplicationPreconditions(page.request, review.slug)
    const current = await editInOtherTab(await context.newPage())
    expect(current.candidateContext).not.toBe(original.expectedCandidateContext)
    const { dialog, cover, consent, submit } = form(page)
    await expect(dialog.getByText(oldContact, { exact: true })).toBeVisible()
    await expect(consent).toBeChecked()
    const readURL = origin + (failedRead === 'session' ? '/api/_auth/session' : '/api/v1/profile')
    let failedGets = 0
    if (failedRead) await page.route(readURL, route => {
      if (route.request().method() !== 'GET') return route.continue()
      failedGets++
      return route.fulfill({ status: 503, json: { error: true, statusCode: 503 } })
    })
    const failed = await submitForm(page, review)
    await expectMismatch(failed)
    expect(failed.request().postDataJSON()).toMatchObject({ ...original, coverLetter: note, shareAcknowledged: true })
    await expectNoWrite(review)
    if (failedRead) {
      const retryRead = dialog.getByRole('button', { name: 'Retry profile review', exact: true })
      await expect(retryRead).toBeVisible()
      expect(failedGets).toBeGreaterThan(0)
      await expect(cover).toHaveValue(note)
      await expect(consent).not.toBeChecked()
      await expect(consent).toBeDisabled()
      await expect(submit).toBeDisabled()
      await expect(dialog.getByRole('region', { name: 'Sign in', exact: true })).toHaveCount(0)
      expect(review.posts).toHaveLength(1)
      await page.unroute(readURL)
      const [retried] = await Promise.all([
        page.waitForResponse(res => res.url() === readURL && res.request().method() === 'GET'),
        retryRead.click(),
      ])
      expect(retried.status()).toBe(200)
      expect((await retried.json()).user.id).toBe(review.owner)
    }
    await expect(dialog.getByText('Your profile changed', { exact: true })).toBeVisible()
    await expect(dialog.getByText(newContact, { exact: true })).toBeVisible()
    await expect(dialog.getByText('+1 202 555 0148', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Revised review headline', { exact: true })).toBeVisible()
    await expect(dialog.getByText(oldContact, { exact: true })).toHaveCount(0)
    await expect(cover).toHaveValue(note)
    await expect(consent).not.toBeChecked()
    await expect(submit).toBeDisabled()
    expect(review.posts).toHaveLength(1)
    await consent.check()
    const accepted = await submitForm(page, review)
    expect(accepted.status()).toBe(200)
    const { id } = await accepted.json()
    expect(Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647).toBe(true)
    expect(accepted.request().postDataJSON()).toMatchObject({ expectedContext: original.expectedContext, expectedCandidateContext: current.candidateContext, coverLetter: note, shareAcknowledged: true })
    await expect(page.getByText('Application received by TalentBay', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View application', exact: true })).toHaveAttribute('href', `/applications?receipt=${id}`)
    expect(review.posts).toHaveLength(2)
    const rows = await sql`select id,user_id,cover_letter,submission_snapshot from applications where vacancy_id=${review.id}`
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id, user_id: review.owner, cover_letter: note })
    expect(rows[0]!.submission_snapshot.candidate).toEqual({ name: current.user.name, email: current.user.email, profile: current.profile })
    expect(await sql`select kind,revision,actor_user_id from application_handling_events where application_id=${id}`).toEqual([{ kind: 'RECEIVED', revision: 1, actor_user_id: review.owner }])
  })
}

test('signing out and into another account clears the first private draft on session refresh', async ({ page, context, review }) => {
  const original = await getApplicationPreconditions(page.request, review.slug)
  const tab = await context.newPage()
  await tab.goto('/settings')
  await tab.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(tab).toHaveURL(`${origin}/jobs`)
  const other = await login(tab.request, review.otherSubject, 'Second review candidate')
  expect(other).not.toBe(review.owner)
  await setFixtureProfile(tab.request, other, { telegram: '@second_review_contact' })

  const [session, failed] = await Promise.all([
    page.waitForResponse(res => new URL(res.url()).pathname === '/api/_auth/session' && res.request().method() === 'GET'),
    submitForm(page, review),
  ])
  await expectMismatch(failed)
  expect(failed.request().postDataJSON()).toMatchObject({ ...original, coverLetter: note })
  expect(session.status()).toBe(200)
  expect((await session.json()).user.id).toBe(other)
  const { dialog, cover, consent, submit } = form(page)
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Apply', exact: true }).click()
  await expect(dialog.getByText('@second_review_contact', { exact: true })).toBeVisible()
  await expect(dialog.getByText(oldContact, { exact: true })).toHaveCount(0)
  await expect(cover).toHaveValue('')
  await expect(consent).not.toBeChecked()
  await expect(submit).toBeDisabled()
  expect(review.posts).toHaveLength(1)
  await expectNoWrite(review, [review.owner, other])
})

test('reviewing only one of two changed contexts cannot create an application', async ({ page, review }) => {
  const old = await getApplicationPreconditions(page.request, review.slug)
  await sql`update vacancies set description='Revised synthetic duties' where id=${review.id}`
  await setFixtureProfile(page.request, review.owner, { telegram: newContact })
  const fresh = await getApplicationPreconditions(page.request, review.slug)
  expect(fresh.expectedContext).not.toBe(old.expectedContext)
  expect(fresh.expectedCandidateContext).not.toBe(old.expectedCandidateContext)
  for (const [preconditions, staleCandidate] of [
    [{ ...fresh, expectedCandidateContext: old.expectedCandidateContext }, true],
    [{ ...fresh, expectedContext: old.expectedContext }, false],
  ] as const) {
    const res = await page.request.post(review.path, { headers, data: { ...preconditions, shareAcknowledged: true, disclosureVersion: 'talentbay-managed-v1', coverLetter: note } })
    expect(res.status()).toBe(412)
    expect((await res.json()).code === 'CANDIDATE_REVIEW_REQUIRED').toBe(staleCandidate)
    await expectNoWrite(review)
  }
})

test('a success response without a valid receipt ID does not claim receipt', async ({ page, review }) => {
  await page.route(`${origin}${review.path}`, route => route.fulfill({ status: 200, json: { id: 0 } }), { times: 1 })
  expect((await submitForm(page, review)).status()).toBe(200)
  const { dialog, cover } = form(page)
  await expect(dialog.getByText('Submission not confirmed', { exact: true })).toBeVisible()
  await expect(cover).toHaveValue(note)
  await expect(page.getByText('Application received by TalentBay', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'View application', exact: true })).toHaveCount(0)
  expect(review.posts).toHaveLength(1)
  await expectNoWrite(review)
})

test('an inline profile edit opened before an account switch cannot overwrite the new owner', async ({ page, context, review }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await form(page).dialog.getByRole('button', { name: 'Review your profile', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Edit profile', exact: true })
  const telegram = editor.getByLabel('Telegram', { exact: true })
  await expect(telegram).toHaveValue(oldContact)
  const pending = { telegram: '@unsaved_first_contact', headline: 'Unsaved first-candidate edit' }
  await editor.getByLabel('Professional headline').fill(pending.headline)
  await telegram.fill(pending.telegram)
  const screenshot = join(tmpdir(), 'talentbay-e2e', `${review.slug}-inline-editor-390.png`)
  await page.screenshot({ path: screenshot, animations: 'disabled' })
  testInfo.annotations.push({ type: 'local screenshot', description: screenshot })

  const tab = await context.newPage()
  await tab.goto('/settings')
  await tab.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(tab).toHaveURL(`${origin}/jobs`)
  const other = await login(tab.request, review.otherSubject, 'Second review candidate')
  expect(other).not.toBe(review.owner)
  const secondProfile = { telegram: '@second_review_contact', headline: 'Second-candidate headline' }
  await setFixtureProfile(tab.request, other, secondProfile)
  const profiles = () => sql`select * from candidate_profiles where user_id in (${review.owner}, ${other}) order by user_id`
  const before = await profiles()
  expect(before).toHaveLength(2)
  expect(before.find(row => row.user_id === review.owner)).toMatchObject({ telegram: oldContact })
  expect(before.find(row => row.user_id === other)).toMatchObject(secondProfile)

  // A tab running the previous client sends its draft without an owner header.
  const legacy = await page.request.put('/api/v1/profile', { headers, data: pending })
  expect(legacy.status()).toBe(412)
  expect(await profiles()).toEqual(before)

  const [rejected] = await Promise.all([
    page.waitForResponse(res => new URL(res.url()).pathname === '/api/v1/profile' && res.request().method() === 'PUT'),
    editor.getByRole('button', { name: 'Save profile', exact: true }).click(),
  ])
  expect(await rejected.request().headerValue('X-TalentBay-Profile-Owner')).toBe(String(review.owner))
  expect(rejected.request().postDataJSON()).toMatchObject(pending)
  expect(rejected.status()).toBe(412)
  expect(await profiles()).toEqual(before)
  const current = await tab.request.get('/api/v1/profile')
  expect(current.status()).toBe(200)
  expect(await current.json()).toMatchObject({ user: { id: other }, profile: secondProfile })
  expect(review.posts).toHaveLength(0)
  await expectNoWrite(review, [review.owner, other])
})

test.describe('first profile read', () => {
  test.use({ startWithConsent: false })

  test('a real 401 after sign-out in another tab opens guest sign-in on the same vacancy', async ({ page, context, review }) => {
    const apply = page.getByRole('button', { name: 'Apply', exact: true })
    await expect(apply).toBeEnabled()
    const tab = await context.newPage()
    await tab.goto('/settings')
    await tab.getByRole('button', { name: 'Sign out', exact: true }).click()
    await expect(tab).toHaveURL(`${origin}/jobs`)
    const session = await tab.request.get('/api/_auth/session')
    expect(session.status()).toBe(200)
    expect((await session.json()).user).toBeUndefined()

    const reads: Request[] = []
    const profileGet = (req: Request) => req.method() === 'GET' && new URL(req.url()).pathname === '/api/v1/profile'
    page.on('request', req => { if (profileGet(req)) reads.push(req) })
    const [unauthorized] = await Promise.all([
      page.waitForResponse(res => profileGet(res.request())),
      apply.click(),
    ])
    expect(unauthorized.status()).toBe(401)
    const { dialog, cover, submit } = form(page)
    const guest = dialog.getByRole('region', { name: 'Sign in', exact: true })
    await expect(guest).toBeVisible()
    await expect(guest.getByRole('link', { name: 'Open this role in Telegram', exact: true })).toBeVisible()
    await expect(page).toHaveURL(`${origin}/jobs/${review.slug}`)
    await expect(dialog.getByRole('button', { name: /retry/i })).toHaveCount(0)
    await expect(cover).toHaveCount(0)
    await expect(submit).toHaveCount(0)
    expect(reads).toHaveLength(1)
    expect(review.posts).toHaveLength(0)
    await expectNoWrite(review)
  })
})
