import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { Request } from '@playwright/test'
import postgres from 'postgres'
import { makeVacancyStart } from '../../shared/utils/telegram-vacancy-entry'
import { getApplicationContext, setFixtureProfile } from './support/application'
import { signedLaunch } from './support/telegram'

const origin = 'http://127.0.0.1:3129'

// Ordinary sign-out lives in Settings and unmounts Apply; changing a cookie in another
// tab does not refresh this tab's session ref. account-flows covers actual 401 expiry.
test('a pinned Apply reload keeps the owner draft without falling back to the changed public role', async ({ page, baseURL }) => {
  expect(baseURL).toBe(origin)
  await page.context().route(url => url.origin !== origin, route => route.abort())
  const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
  const slug = `pin-recovery-${randomUUID()}`, subject = randomInt(1e9, 1e12)
  const detail = `/api/v1/vacancies/${slug}`
  try {
    const [org] = await sql`insert into organisations (name, slug, status) values ('Pin recovery fixture', ${slug}, 'ACTIVE') returning id`
    const [job] = await sql`insert into vacancies (organisation_id, slug, title, description, status, review_status, employment_type, workplace_type, country_code)
      values (${org!.id}, ${slug}, 'Original pinned role', 'Synthetic duties', 'PUBLISHED', 'VERIFIED', 'FULL_TIME', 'REMOTE', 'GB') returning id`
    const id = Number(job!.id)
    const login = await page.request.post('/api/v1/auth/telegram', { headers: { origin }, data: { initData: signedLaunch(subject, 'Pin recovery candidate') } })
    expect(login.status()).toBe(200)
    const owner = (await login.json()).user.id
    await setFixtureProfile(page.request, owner, { telegram: '@pin_recovery_fixture' })
    const original = await getApplicationContext(page.request, slug)
    const pin = makeVacancyStart(id, original)
    expect(pin).not.toBeNull()
    const route = `/jobs/${slug}?entry=${pin}`
    expect((await page.goto(route))?.status()).toBe(200)
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAccessibleName('Apply for Original pinned role')
    const note = dialog.getByRole('textbox', { name: 'Cover note' }), draft = `Private fixture note for ${slug}`
    await note.fill(draft)
    await dialog.getByRole('checkbox', { name: /I ask TalentBay to contact/ }).check()

    await sql`update vacancies set title='Changed pinned role' where id=${id}`
    // Positive control: only the original pin is obsolete; the canonical detail still works.
    expect(await getApplicationContext(page.request, slug)).not.toBe(original)
    const reads: string[] = []
    let posts = 0
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname === detail && request.method() === 'GET') reads.push(url.search)
      if (url.pathname === `/api/v1/vacancies/${id}/applications` && request.method() === 'POST') posts++
    })
    const submit = dialog.getByRole('button', { name: 'Submit application' })
    const [rejected] = await Promise.all([
      page.waitForResponse(res => res.request().method() === 'POST' && new URL(res.url()).pathname === `/api/v1/vacancies/${id}/applications`),
      submit.click(),
    ])
    expect(rejected.status()).toBe(412)
    expect(rejected.request().postDataJSON().expectedContext).toBe(original)

    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    await page.route(url => url.pathname === detail, async intercepted => { await held; await intercepted.continue() }, { times: 1 })
    let reload: Request
    try {
      const [request] = await Promise.all([
        page.waitForRequest(req => req.method() === 'GET' && new URL(req.url()).pathname === detail),
        dialog.getByRole('button', { name: 'Reload listing' }).click(),
      ])
      reload = request
      expect(new URL(reload.url()).search).toBe(`?entry=${pin}`)
      await expect(note).toHaveValue(draft)
      await expect(submit).toBeDisabled()
    } finally { release() }
    expect((await reload.response())?.status()).toBe(404)
    await expect(dialog).toHaveAccessibleName('Application unavailable')
    await expect(dialog.getByRole('status')).toHaveText('Submission is no longer available for this application.')
    await expect(note).toHaveValue(draft)
    await expect(note).toHaveJSProperty('readOnly', true)
    await expect(submit).toHaveCount(0)
    await expect(dialog.getByRole('link', { name: 'Browse jobs' })).toHaveAttribute('href', '/jobs')
    await expect(page).toHaveURL(origin + route)
    expect((await (await page.request.get('/api/_auth/session')).json()).user.id).toBe(owner)
    expect(reads).toEqual([`?entry=${pin}`])
    expect(posts).toBe(1)
    expect(await sql`select id from applications where vacancy_id=${id}`).toHaveLength(0)
  } finally {
    try {
      await sql.begin(async tx => {
        await tx`delete from users where id in (select user_id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject)})`
        await tx`delete from vacancies where slug=${slug}`
        await tx`delete from organisations where slug=${slug}`
      })
    } finally { await sql.end() }
  }
})
