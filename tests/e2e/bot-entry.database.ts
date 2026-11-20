import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import postgres from 'postgres'
import { signedLaunch, testEntryBotID, testWebhookSecret } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const firstID = randomInt(1_000_000_000, 1_000_000_000_000)
const updateIDs = [firstID, firstID + 1]
const data = (update_id = firstID, text = '/applications', subject = 42) => ({ update_id, message: { message_id: 4, from: { id: subject, is_bot: false, first_name: 'Fictional private name' }, chat: { id: subject, type: 'private' }, text } })
const headers = { 'x-telegram-bot-api-secret-token': testWebhookSecret }
test.afterAll(async () => { await sql`delete from bot_entry_receipts where bot_id=${testEntryBotID} and update_id in ${sql(updateIDs)}`; await sql.end() })

test('compiled bot webhook authenticates before persistence and prepares one reply under HTTP retries/concurrency', async ({ request }) => {
  const before = await sql`select * from bot_entry_receipts where bot_id=${testEntryBotID}`
  expect((await request.post('/api/v1/bot/telegram', { data: data() })).status()).toBe(403)
  expect((await request.post('/api/v1/bot/telegram', { headers: { ...headers, 'content-type': 'text/plain' }, data: '{}' })).status()).toBe(415)
  expect((await request.post('/api/v1/bot/telegram', { headers, data: { update_id: -1 } })).status()).toBe(400)
  expect((await request.post('/api/v1/bot/telegram', { headers, data: { ...data(), padding: 'x'.repeat(65536) } })).status()).toBe(413)
  expect((await request.post('/api/v1/bot/telegram', { headers: { ...headers, 'content-type': 'application/json' }, data: Buffer.from([0xff]) })).status()).toBe(400)
  const group = data(); group.message.chat = { id: -42, type: 'group' }
  expect(await (await request.post('/api/v1/bot/telegram', { headers, data: group })).json()).toEqual({ ok: true })
  expect(await sql`select * from bot_entry_receipts where bot_id=${testEntryBotID}`).toEqual(before)
  const response = await request.post('/api/v1/bot/telegram', { headers, data: data() })
  expect(response.status()).toBe(200)
  expect(response.headers()['set-cookie']).toBeUndefined()
  expect(response.headers()['cache-control']).toBe('no-store')
  const reply = await response.json()
  expect(reply).toMatchObject({ method: 'sendMessage', chat_id: 42, reply_markup: { inline_keyboard: [[{ web_app: { url: 'https://talentbay.example/applications' } }]] } })
  expect(JSON.stringify(reply)).not.toContain('Fictional private name')
  expect(JSON.stringify(reply)).not.toContain(testWebhookSecret)
  expect(await (await request.post('/api/v1/bot/telegram', { headers, data: data() })).json()).toEqual({ ok: true })
  const reused = data(); reused.message.chat.id = 84; reused.message.from.id = 84
  expect(await (await request.post('/api/v1/bot/telegram', { headers, data: reused })).json()).toEqual({ ok: true })
  const bodies = await Promise.all(Array.from({ length: 5 }, async () => (await request.post('/api/v1/bot/telegram', { headers, data: data(firstID + 1, '/start') })).json()))
  expect(bodies.filter(body => body.method === 'sendMessage')).toHaveLength(1)
  const rows = await sql`select * from bot_entry_receipts where bot_id=${testEntryBotID} and update_id in ${sql(updateIDs)}`
  expect(rows).toHaveLength(2)
  expect(Object.keys(rows[0]!).sort()).toEqual(['bot_id', 'prepared_at', 'update_id'])
  expect((await request.get('/api/v1/auth/identities')).status()).toBe(401)
})

async function guestJobPayload(page: Page, slug: string, title: string, id: number) {
  const detail = await page.request.get(`/api/v1/vacancies/${slug}`)
  expect(detail.status()).toBe(200)
  const vacancy = await detail.json()
  expect(vacancy).toMatchObject({ id, slug, title, applicationContext: expect.stringMatching(/^v1:[0-9a-f]{64}$/) })
  const payload = `job_${id}_${vacancy.applicationContext.slice(3, 27)}`
  const href = `https://t.me/talentbay_test_bot?start=${payload}`
  await page.goto(`/jobs/${slug}`)
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sign in to apply', exact: true }).click()
  const panel = page.getByRole('dialog', { name: `Apply for ${title}`, exact: true })
  const link = panel.locator(`a[href="${href}"]`)
  await expect(link).toBeVisible()
  return new URL((await link.getAttribute('href'))!).searchParams.get('start')!
}

async function startJob(request: APIRequestContext, subject: number, update: number, payload: string, path: string) {
  const res = await request.post('/api/v1/bot/telegram', { headers, data: data(update, `/start ${payload}`, subject) })
  expect(res.status()).toBe(200)
  const reply = await res.json()
  expect(reply).toMatchObject({ method: 'sendMessage', chat_id: subject, text: expect.any(String) })
  const buttons: { web_app?: { url: string } }[] = reply.reply_markup.inline_keyboard.flat()
  const destinations = buttons.flatMap(button => button.web_app ? [button.web_app.url] : [])
  const expected = path === '/jobs' ? path : `${path}?entry=${payload}`
  expect(destinations).toEqual([`https://talentbay.example${expected}`])
  // Change only the origin for loopback; retain the exact path and query delivered to the candidate.
  const url = new URL(destinations[0]!)
  return { path: url.pathname + url.search, text: String(reply.text), body: JSON.stringify(reply) }
}

test('guest Apply link opens the same job in a signed Mini App and fails closed after a change or archive', async ({ page, browser, request, baseURL }) => {
  const suffix = randomUUID()
  const slug = `bot-entry-${suffix}`, title = `Bot entry engineer ${suffix.slice(0, 8)}`
  const replacementSlug = `bot-recipient-${suffix}`
  const revised = `Revised engineer ${suffix.slice(0, 8)}`, company = `Bot entry company ${suffix.slice(0, 8)}`
  const subject = randomInt(1e9, 1e12)
  const updates: number[] = []
  const start = (payload: string, path: string) => {
    const update = firstID + 2 + updates.length
    updates.push(update)
    return startJob(request, subject, update, payload, path)
  }
  const unavailable = (reply: Awaited<ReturnType<typeof startJob>>) => {
    expect(reply.text).toMatch(/changed|unavailable|no longer|not (?:available|public|found)|removed|expired/i)
    for (const value of [slug, title, revised, company]) expect(reply.body).not.toContain(value)
  }
  expect(baseURL).toBe('http://127.0.0.1:3129')
  const host = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } })
  try {
    for (const context of [page.context(), host]) {
      await context.route(url => url.origin !== baseURL, route => route.abort())
    }
    const [org] = await sql`insert into organisations (name, slug, status) values (${company}, ${slug}, 'ACTIVE') returning id`
    const [row] = await sql`insert into vacancies (organisation_id, slug, title, description, status, review_status, employment_type, workplace_type, country_code, published_at, source_name)
      values (${org!.id}, ${slug}, ${title}, 'Synthetic bot-entry role', 'PUBLISHED', 'VERIFIED', 'FULL_TIME', 'REMOTE', 'GB', now(), 'Bot entry fixture') returning id`
    const id = Number(row!.id)
    expect(Number.isInteger(id) && id > 0 && id <= 2_147_483_647).toBe(true)
    const path = `/jobs/${slug}`
    const original = await guestJobPayload(page, slug, title, id)
    const published = await start(original, path)
    const candidate = await host.newPage()
    await candidate.addInitScript(() => {
      const initData = new URLSearchParams(location.hash.slice(1)).get('tgWebAppData')
      if (initData) window.Telegram = { WebApp: { initData, ready: () => {}, safeAreaInset: { top: 13, right: 0, bottom: 0, left: 0 } } }
    })
    const carrier = new URLSearchParams({ tgWebAppData: signedLaunch(subject, 'Bot Entry Candidate') })
    const [login] = await Promise.all([
      candidate.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/auth/telegram' && r.request().method() === 'POST'),
      candidate.goto(`${published.path}#${carrier}`),
    ])
    expect(login.status()).toBe(200)
    await expect(candidate).toHaveURL(`${baseURL}${published.path}`)
    const session = await (await candidate.request.get('/api/_auth/session')).json()
    expect(session.user).toMatchObject({ id: (await login.json()).user.id, name: 'Bot Entry Candidate' })
    await expect(candidate.locator('html')).toHaveCSS('--host-safe-top', '13px')
    await expect(candidate.getByRole('heading', { name: title, level: 1 })).toBeVisible()
    await candidate.getByRole('button', { name: 'Apply', exact: true }).click()
    const panel = candidate.getByRole('dialog', { name: `Apply for ${title}`, exact: true })
    await expect(panel.getByText(/not directly to the employer/i)).toBeVisible()
    await expect(panel.getByRole('checkbox', { name: `I ask TalentBay to contact ${company} and share this application with them for this role.` })).not.toBeChecked()
    await expect(panel.getByRole('button', { name: 'Submit application' })).toBeDisabled()
    expect((await (await page.request.get('/api/_auth/session')).json()).user).toBeUndefined()

    async function neutralPage() {
      await expect(candidate.getByRole('heading', { name: 'Page not found' })).toBeVisible()
      await expect(candidate.getByRole('button', { name: /^(?:sign in to apply|apply|submit application)$/i })).toHaveCount(0)
      for (const value of [title, revised, company]) await expect(candidate.getByText(value, { exact: true })).toHaveCount(0)
    }
    async function coldUnavailable(buttonPath: string) {
      const res = await candidate.goto(buttonPath)
      expect(res?.status()).toBe(404)
      const html = await res!.text()
      for (const value of [title, revised, company]) expect(html).not.toContain(value)
      await neutralPage()
    }
    const retitled = await test.step('changing the public title invalidates both the start and the delivered button', async () => {
      await sql`update vacancies set title=${revised} where id=${id}`
      unavailable(await start(original, '/jobs'))
      await coldUnavailable(published.path)
      const payload = await guestJobPayload(page, slug, revised, id)
      expect(payload).not.toBe(original)
      const button = await start(payload, path)
      const api = `/api/v1/vacancies/${slug}`
      const current = await request.get(`${api}?entry=${payload}`)
      expect(current.status()).toBe(200)
      expect(await current.json()).toMatchObject({ id, title: revised })
      for (const query of ['entry=', 'entry=invalid', `entry=job_${id}`, `entry=${original}`, `entry=${payload}&entry=${payload}`]) {
        const rejected = await request.get(`${api}?${query}`)
        expect(rejected.status()).toBe(404)
        const body = await rejected.text()
        for (const value of [title, revised, company]) expect(body).not.toContain(value)
      }
      return { payload, button }
    })
    const fresh = await test.step('a different recipient with the same display name also invalidates the link', async () => {
      await sql`with replacement as (
        insert into organisations (name, slug, status) values (${company}, ${replacementSlug}, 'ACTIVE') returning id
      ) update vacancies set organisation_id=replacement.id from replacement where vacancies.id=${id}`
      unavailable(await start(retitled.payload, '/jobs'))
      await coldUnavailable(retitled.button.path)
      const payload = await guestJobPayload(page, slug, revised, id)
      expect(payload).not.toBe(retitled.payload)
      const button = await start(payload, path)
      expect((await candidate.goto(button.path))?.status()).toBe(200)
      await expect(candidate.getByRole('heading', { level: 1, name: revised })).toBeVisible()
      await expect(candidate.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled()

      // Put the previously delivered button in same-document history, then let the router handle a real Back.
      const documentStart = await candidate.evaluate(stale => {
        const current = location.href
        history.replaceState(history.state, '', stale)
        history.pushState(null, '', current)
        history.back()
        return performance.timeOrigin
      }, published.path)
      await expect(candidate).toHaveURL(`${baseURL}${published.path}`)
      await neutralPage()
      expect(await candidate.evaluate(() => performance.timeOrigin)).toBe(documentStart)
      return { payload, button }
    })
    await start(`job_${id}`, '/jobs')

    await test.step('archiving invalidates the current link and removes the listing from the UI', async () => {
      await sql`update vacancies set status='ARCHIVED' where id=${id}`
      const removed = await start(fresh.payload, '/jobs')
      unavailable(removed)
      await candidate.goto(removed.path)
      await candidate.getByRole('textbox', { name: 'Search vacancies' }).fill(revised)
      await candidate.getByRole('button', { name: 'Search', exact: true }).click()
      await expect(candidate.getByText('No matching vacancies', { exact: true })).toBeVisible()
      await coldUnavailable(fresh.button.path)
      await coldUnavailable(path)
    })
    expect(await sql`select id from applications where vacancy_id=${id}`).toHaveLength(0)
  }
  finally {
    await host.close()
    await sql.begin(async tx => {
      if (updates.length) await tx`delete from bot_entry_receipts where bot_id=${testEntryBotID} and update_id in ${tx(updates)}`
      await tx`delete from users where id in (select user_id from oauth_accounts where provider='TELEGRAM' and provider_account_id=${String(subject)})`
      await tx`delete from vacancies where slug=${slug} and organisation_id in (select id from organisations where slug in (${slug}, ${replacementSlug}))`
      await tx`delete from organisations where slug in (${slug}, ${replacementSlug})`
    })
  }
})
