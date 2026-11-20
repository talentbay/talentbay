import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { getApplicationPreconditions, setFixtureProfile } from './support/application'
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
    const owner = await login(candidate, subject, 'Handling Browser Candidate')
    await setFixtureProfile(candidate.request, owner.id, { headline: 'Submitted headline', telegram: '@handling_browser' })
    const preconditions = await getApplicationPreconditions(candidate.request, suffix)
    const receipt = await candidate.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers: { origin }, data: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, coverLetter: 'Submitted browser note.', ...preconditions } })
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
    const switchAction = async (label: string) => {
      await dialog.getByRole('combobox', { name: 'Next action' }).click()
      await page.getByRole('option', { name: label, exact: true }).click()
    }
    const checkNoResponseOption = async (contactRecorded: boolean) => {
      await switchAction('Close handling')
      await dialog.getByRole('combobox', { name: 'Reason', exact: true }).click()
      const options = page.getByRole('listbox')
      await expect(options.getByRole('option', { name: 'Company contact unavailable' })).toBeVisible()
      await expect(options.getByRole('option', { name: 'No company response' })).toHaveCount(contactRecorded ? 1 : 0)
      await page.keyboard.press('Escape')
    }
    await checkNoResponseOption(false)
    await switchAction('Start handling')
    await dialog.getByLabel('Private operator note').fill('Private handling browser note')
    await dialog.getByRole('button', { name: 'Record action', exact: true }).click()
    await expect(dialog.getByText('TalentBay is reviewing', { exact: true })).toBeVisible()
    await dialog.getByRole('combobox', { name: 'Next action' }).click()
    await page.getByRole('option', { name: 'Record company contact', exact: true }).click()
    await dialog.getByLabel('Private reference', { exact: true }).fill('Private company contact reference')
    await dialog.getByRole('button', { name: 'Record action', exact: true }).click()
    await expect(dialog.getByRole('combobox', { name: 'Next action' })).toBeEnabled()
    await expect(dialog.getByText('Company contact recorded', { exact: true }).first()).toBeVisible()
    await checkNoResponseOption(true)
    await switchAction('Record completed handoff')
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
    await expect(application).toHaveCSS('opacity', '1')
    for (const width of [320, 390, 1440]) {
      await view.setViewportSize({ width, height: 900 })
      expect(await view.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await view.screenshot({ path: testInfo.outputPath(`candidate-recorded-handoff-${width}.png`), fullPage: true })
    }
    const shared = (await progress.json()).events.find((event: { kind: string }) => event.kind === 'SHARED')
    // Keep the original handoff outside the first candidate page while an operator corrects it.
    let revision = shared.revision as number
    for (let n = 0; n < 26; n++) {
      const next = await operator.request.post(`/api/v1/admin/applications/${applicationID}/handling`, {
        headers: { origin }, data: { action: 'FOLLOW_UP', expectedRevision: revision, commandKey: randomUUID() },
      })
      expect(next.ok()).toBe(true)
      revision = (await next.json()).revision
    }
    await view.goto(`/applications?receipt=${applicationID}`)
    const earlier = application.getByRole('button', { name: 'Earlier activity' })
    await expect(earlier).toBeVisible()
    await expect(application.getByText(/This does not confirm delivery/)).toBeVisible()
    await page.goto(`/ktulhu/v1/applications?review=${applicationID}`)
    await dialog.getByText('Correct or reopen handling', { exact: true }).click()
    const recovery = dialog.getByRole('form', { name: 'Application recovery' })
    await recovery.getByRole('spinbutton', { name: 'Entry revision' }).fill(String(shared.revision))
    await recovery.getByRole('textbox', { name: 'Private recovery note' }).fill('Private correction after checking the journal')
    await recovery.getByRole('button', { name: 'Record correction' }).click()
    await expect(dialog.getByText('The handoff record was corrected. Delivery and recall are unconfirmed. Do not share the candidate package again.', { exact: true })).toBeVisible()
    await expect(dialog.getByText('A manual handoff was recorded. This is not proof of employer delivery, reading or a hiring decision.')).toHaveCount(0)
    await earlier.click()
    await expect(application.getByText('The handoff record was corrected. We cannot confirm whether the company received your application or whether any shared copy was recalled.', { exact: true })).toBeVisible()
    await expect(application.getByRole('heading', { name: 'TalentBay is reviewing' })).toBeVisible()
    await expect(application.getByText('TalentBay is following up', { exact: true })).toHaveCount(0)
    await expect(application.getByText(/This does not confirm delivery/)).toHaveCount(0)
    await expect(application).not.toContainText('Private correction after checking the journal')
    await earlier.click()
    const correctedEntry = application.getByRole('listitem').filter({ hasText: 'TalentBay recorded a manual handoff' })
    await expect(correctedEntry).toContainText('A later correction marks this entry as inaccurate.')
    await application.getByRole('button', { name: 'Withdraw application', exact: true }).click()
    await application.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click()
    await expect(application).not.toBeVisible()
    expect((await operator.request.get(`/api/v1/admin/applications/${applicationID}/package`)).status()).toBe(409)
    expect((await sql`select status,handling_stage from applications where id=${applicationID}`)[0]).toEqual({ status: 'WITHDRAWN', handling_stage: 'CLOSED' })
    expect(runtimeErrors).toEqual([])
  } finally { await candidate.close(); await operator.close() }
})

test('a stale review cannot expose or reuse a candidate package until the operator reloads', async ({ browser, context, page }) => {
  const candidate = await browser.newContext({ baseURL: origin })
  try {
    const owner = await login(candidate, subject + 8, 'Packet revision candidate')
    const headers = { origin }
    await setFixtureProfile(candidate.request, owner.id, { telegram: '@packet_fixture' })
    const preconditions = await getApplicationPreconditions(candidate.request, suffix)
    const receipt = await candidate.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers, data: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, ...preconditions } })
    expect(receipt.ok()).toBe(true)
    const { id } = await receipt.json()
    const admin = await login(context, subject + 9, 'Packet revision operator')
    await sql`update users set role='ADMIN' where id=${admin.id}`
    await login(context, subject + 9, 'Packet revision operator')
    const endpoint = `/api/v1/admin/applications/${id}/handling`
    let revision = 1
    const record = async (data: object) => {
      const result = await context.request.post(endpoint, { headers, data: { ...data, expectedRevision: revision, commandKey: randomUUID() } })
      expect(result.ok()).toBe(true)
      revision = (await result.json()).revision
    }
    const contact = () => record({ action: 'CONTACT', channel: 'EMAIL', occurredAt: new Date().toISOString(), reference: 'Synthetic contact' })
    await record({ action: 'ASSIGN', assigneeID: admin.id })
    await record({ action: 'START' })
    await contact()
    await page.goto(`/ktulhu/v1/applications?review=${id}`)
    const dialog = page.getByRole('dialog')
    const chooseHandoff = async () => {
      await dialog.getByRole('combobox', { name: 'Next action' }).click()
      await page.getByRole('option', { name: 'Record completed handoff', exact: true }).click()
    }
    await chooseHandoff()
    const prepare = dialog.getByRole('button', { name: 'Prepare candidate package', exact: true })
    const packet = dialog.getByRole('textbox', { name: 'Candidate package' })
    await contact()
    await prepare.click()
    const reload = dialog.getByRole('button', { name: 'Reload record' })
    await expect(reload).toBeVisible()
    await expect(packet).toHaveCount(0)
    const reloadAndPrepare = async () => {
      await reload.click()
      await expect(reload).not.toBeVisible()
      if (!await prepare.isVisible()) await chooseHandoff()
      await prepare.click()
      await expect(packet).toHaveValue(/@packet_fixture/)
    }
    await reloadAndPrepare()
    await contact()
    await dialog.getByLabel('Private reference', { exact: true }).fill('Synthetic handoff reference')
    await dialog.getByRole('checkbox', { name: /I have already shared/ }).check()
    const response = page.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().method() === 'POST')
    await dialog.getByRole('button', { name: 'Record completed handoff', exact: true }).click()
    expect((await response).status()).toBe(409)
    await expect(reload).toBeVisible()
    await expect(packet).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Copy package' })).toHaveCount(0)
    expect(await sql`select id from application_handling_events where application_id=${id} and kind='SHARED'`).toHaveLength(0)
    await reloadAndPrepare()
    await expect(dialog.getByRole('checkbox', { name: /I have already shared/ })).not.toBeChecked()

    // A definitive rejection invalidates the packet even if the next read returns the same revision.
    await page.route(endpoint, route => route.fulfill({ status: 404, json: { statusCode: 404 } }), { times: 1 })
    await dialog.getByLabel('Private reference', { exact: true }).fill('Synthetic handoff reference')
    await dialog.getByRole('checkbox', { name: /I have already shared/ }).check()
    await dialog.getByRole('button', { name: 'Record completed handoff', exact: true }).click()
    await expect(reload).toBeVisible()
    await expect(packet).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Copy package' })).toHaveCount(0)
    await reloadAndPrepare()
    await expect(dialog.getByRole('checkbox', { name: /I have already shared/ })).not.toBeChecked()
  } finally { await candidate.close() }
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

test('closed handling → reopen with lost-response retry → append correction → candidate history without private note', async ({ browser }, testInfo) => {
  const candidate = await browser.newContext({ baseURL: origin })
  const operator = await browser.newContext({ baseURL: origin })
  try {
    const owner = await login(candidate, subject + 3, 'Recovery Browser Candidate')
    await setFixtureProfile(candidate.request, owner.id, { telegram: '@recovery_fixture' })
    const preconditions = await getApplicationPreconditions(candidate.request, suffix)
    const receipt = await candidate.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers: { origin }, data: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, ...preconditions } })
    expect(receipt.status()).toBe(200)
    const id = (await receipt.json()).id
    const admin = await login(operator, subject + 4, 'Recovery Browser Operator')
    await sql`update users set role='ADMIN' where id=${admin.id}`
    await login(operator, subject + 4, 'Recovery Browser Operator')
    let revision = 1
    const command = async (input: object) => {
      const response = await operator.request.post(`/api/v1/admin/applications/${id}/handling`, { headers: { origin }, data: { ...input, expectedRevision: revision, commandKey: randomUUID() } })
      expect(response.status()).toBe(200)
      revision = (await response.json()).revision
    }
    await command({ action: 'ASSIGN', assigneeID: admin.id })
    await command({ action: 'START' })
    await command({ action: 'CONTACT', channel: 'EMAIL', occurredAt: new Date().toISOString(), reference: 'Private original contact reference' })
    const [original] = await sql`select * from application_handling_events where application_id=${id} and revision=4`
    await command({ action: 'CLOSE', reason: 'NO_RESPONSE' })
    const page = await operator.newPage()
    await page.goto('/ktulhu/v1/applications')
    await page.getByRole('button', { name: 'Review Recovery Browser Candidate for Handling Browser Engineer', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByText('Correct or reopen handling', { exact: true }).press('Enter')
    const recovery = dialog.getByRole('form', { name: 'Application recovery' })
    await recovery.getByRole('combobox', { name: 'Recovery action' }).click()
    await page.getByRole('option', { name: 'Reopen and take application', exact: true }).click()
    await recovery.getByRole('textbox', { name: 'Private recovery note' }).fill('PRIVATE_RECOVERY_REASON_NOT_PUBLIC')
    let dropped = false
    await page.route('**/api/v1/admin/applications/*/handling', async (route) => {
      if (!dropped && route.request().postDataJSON().action === 'REOPEN') {
        dropped = true
        expect((await route.fetch()).status()).toBe(200)
        return route.fulfill({ status: 503, body: '{}' })
      }
      return route.continue()
    })
    await recovery.getByRole('button', { name: 'Reopen and take application', exact: true }).click()
    await expect(recovery.getByText('Recovery not confirmed', { exact: true })).toBeVisible()
    await expect(recovery.getByRole('textbox', { name: 'Private recovery note' })).toHaveValue('PRIVATE_RECOVERY_REASON_NOT_PUBLIC')
    await recovery.getByRole('button', { name: 'Reopen and take application', exact: true }).click()
    await expect(dialog.getByText('TalentBay is reviewing', { exact: true })).toBeVisible()
    expect(await sql`select id from application_handling_events where application_id=${id} and kind='REOPENED'`).toHaveLength(1)
    await recovery.getByRole('spinbutton', { name: 'Entry revision' }).fill('4')
    await recovery.getByRole('textbox', { name: 'Private recovery note' }).fill('PRIVATE_CORRECTION_NOTE_NOT_PUBLIC')
    await recovery.getByRole('button', { name: 'Record correction', exact: true }).click()
    await expect(dialog.getByText('Correction recorded by TalentBay', { exact: true })).toBeVisible()
    expect((await sql`select * from application_handling_events where application_id=${id} and revision=4`)[0]).toEqual(original)
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`operator-history-recovery-${width}.png`), fullPage: true, animations: 'disabled' })
    }
    const view = await candidate.newPage()
    await view.setViewportSize({ width: 390, height: 844 })
    await view.goto('/applications')
    await view.getByRole('button', { name: 'View application for Handling Browser Engineer', exact: true }).click()
    const application = view.getByRole('dialog')
    await expect(application.getByText('Correction recorded by TalentBay', { exact: true })).toBeVisible()
    await expect(application.getByText('A later correction marks this entry as inaccurate.', { exact: true })).toBeVisible()
    await expect(application.getByText('TalentBay resumed reviewing', { exact: true })).toBeVisible()
    await expect(application.getByText('No company response', { exact: true })).toHaveCount(0)
    const progress = await candidate.request.get(`/api/v1/applications/${id}/progress`)
    expect(await progress.text()).not.toMatch(/PRIVATE_|Private original|actorUserID|assignedUserID|channel|reference|privateNote/)
    await view.screenshot({ path: testInfo.outputPath('candidate-history-correction-390.png'), fullPage: true, animations: 'disabled' })
    await application.getByRole('button', { name: 'Withdraw application', exact: true }).click()
    await application.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click()
    const [withdrawn] = await sql`select handling_revision from applications where id=${id}`
    expect((await operator.request.post(`/api/v1/admin/applications/${id}/handling`, { headers: { origin }, data: { action: 'REOPEN', expectedRevision: withdrawn!.handling_revision, commandKey: randomUUID(), privateNote: 'Cannot restore withdrawn consent' } })).status()).toBe(409)
    await sql`update users set role='USER' where id=${admin.id}`
    await recovery.getByRole('spinbutton', { name: 'Entry revision' }).fill('4')
    await recovery.getByRole('textbox', { name: 'Private recovery note' }).fill('Revoked access cannot write a correction')
    await recovery.getByRole('button', { name: 'Record correction', exact: true }).click()
    await expect(recovery.getByText('Your operator access changed.', { exact: true })).toBeVisible()
    await expect(recovery.getByRole('button', { name: 'Record correction', exact: true })).toBeDisabled()
  }
  finally { await candidate.close(); await operator.close() }
})
