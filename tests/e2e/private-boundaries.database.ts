import { randomInt, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'
import postgres from 'postgres'
import { getApplicationPreconditions, setFixtureProfile } from './support/application'
import { signedLaunch } from './support/telegram'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const subject = randomInt(1_000_000_000, 1_000_000_000_000), slug = `private-${randomUUID()}`
const userIDs: number[] = []
let companyID: number, vacancyID: number
const origin = 'http://127.0.0.1:3129', headers = { origin, 'content-type': 'application/json' }
async function signIn(context: BrowserContext, offset: number) {
  const response = await context.request.post('/api/v1/auth/telegram', { headers, data: { initData: signedLaunch(subject + offset, `Private Boundary Fixture ${offset}`) } })
  expect(response.status()).toBe(200)
  const user = (await response.json()).user
  userIDs.push(user.id)
  return user
}
test.beforeAll(async () => {
  const [company] = await sql`insert into organisations (name,slug,status) values ('Fictional Private Boundary Company',${slug},'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code)
    values (${companyID},${slug},'Fictional Private Boundary Engineer','Only a privacy test fixture','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB') returning id`
  vacancyID = vacancy!.id
})
test.afterAll(async () => {
  if (userIDs.length) await sql`delete from users where id in ${sql([...new Set(userIDs)])}`
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql.end()
})

test('anonymous private API failures are non-cacheable before body or resource validation', async ({ context }) => {
  for (const [method, path] of [
    ['GET', '/api/v1/profile'], ['PUT', '/api/v1/profile'], ['GET', '/api/v1/applications'],
    ['GET', `/api/v1/applications/1/progress`], ['POST', '/api/v1/applications/1/withdraw'],
    ['GET', '/api/v1/auth/identities'], ['POST', '/api/v1/auth/link'],
    ['GET', `/api/v1/vacancies/${vacancyID}/application`], ['POST', `/api/v1/vacancies/${vacancyID}/applications`],
  ] as const) {
    const response = await context.request.fetch(path, { method, headers, ...(method === 'POST' || method === 'PUT' ? { data: {} } : {}) })
    expect(response.status(), path).toBe(401)
    expect(response.headers()['cache-control'], path).toBe('no-store')
    expect(Object.keys(await response.json()).sort()).toEqual(['error', 'message', 'statusCode', 'statusMessage'])
  }
})

test('profile and linking inputs are bounded/strict and cannot choose another user or privilege', async ({ context }) => {
  const user = await signIn(context, 1)
  await setFixtureProfile(context.request, user.id, { telegram: '@private_owner_fixture' })
  for (const endpoint of ['/api/v1/profile', '/api/v1/auth/link']) {
    const method = endpoint.endsWith('link') ? 'POST' : 'PUT'
    const inputHeaders = method === 'PUT' ? { ...headers, 'X-TalentBay-Profile-Owner': String(user.id) } : headers
    const large = await context.request.fetch(endpoint, { method, headers: inputHeaders, data: ' '.repeat(70_000) + '{}' })
    expect(large.status(), endpoint).toBe(413)
    expect(large.headers()['cache-control']).toBe('no-store')
    const wrongType = await context.request.fetch(endpoint, { method, headers: { ...inputHeaders, 'content-type': 'text/plain' }, data: '{}' })
    expect(wrongType.status()).toBe(415)
    const crossOrigin = await context.request.fetch(endpoint, { method, headers: { ...headers, origin: 'https://attacker.invalid' }, data: {} })
    expect(crossOrigin.status()).toBe(403)
    const injected = await context.request.fetch(endpoint, { method, headers: inputHeaders, data: { userID: user.id + 1, role: 'ADMIN', ...(endpoint.endsWith('link') ? { provider: 'GOOGLE' } : { telegram: '@not_accepted' }) } })
    expect(injected.status()).toBe(400)
  }
  expect((await sql`select role from users where id=${user.id}`)[0]!.role).toBe('USER')
  expect((await sql`select telegram from candidate_profiles where user_id=${user.id}`)[0]!.telegram).toBe('@private_owner_fixture')
})

test('owner, another candidate and current/revoked admin receive only their permitted projections', async ({ context, browser }) => {
  const owner = await signIn(context, 2)
  const otherContext = await browser.newContext({ baseURL: origin })
  const adminContext = await browser.newContext({ baseURL: origin })
  try {
    const other = await signIn(otherContext, 3), admin = await signIn(adminContext, 4)
    await sql`update users set role='ADMIN' where id=${admin.id}`
    await signIn(adminContext, 4)
    await setFixtureProfile(context.request, owner.id, { telegram: '@PRIVATE_OWNER_CONTACT', about: 'PRIVATE_OWNER_ABOUT' })
    const preconditions = await getApplicationPreconditions(context.request, slug)
    const created = await context.request.post(`/api/v1/vacancies/${vacancyID}/applications`, { headers, data: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, coverLetter: 'PRIVATE_OWNER_NOTE', ...preconditions } })
    expect(created.status()).toBe(200)
    const id = (await created.json()).id
    for (const [revision, action, extra] of [[1, 'ASSIGN', { assigneeID: admin.id }], [2, 'START', {}], [3, 'CONTACT', { channel: 'EMAIL', occurredAt: new Date().toISOString(), reference: 'PRIVATE_INTERNAL_REFERENCE', privateNote: 'PRIVATE_INTERNAL_NOTE' }]] as const) {
      expect((await adminContext.request.post(`/api/v1/admin/applications/${id}/handling`, { headers, data: { expectedRevision: revision, commandKey: randomUUID(), action, ...extra } })).status()).toBe(200)
    }
    const progress = await context.request.get(`/api/v1/applications/${id}/progress`)
    expect(progress.status()).toBe(200); expect(progress.headers()['cache-control']).toBe('no-store')
    for (const value of ['PRIVATE_INTERNAL_REFERENCE', 'PRIVATE_INTERNAL_NOTE', 'actorUserID', 'commandDigest', 'channel']) expect(await progress.text()).not.toContain(value)
    for (const response of [await otherContext.request.get(`/api/v1/applications/${id}/progress`), await otherContext.request.post(`/api/v1/applications/${id}/withdraw`, { headers, data: {} })]) {
      expect(response.status()).toBe(404); expect(response.headers()['cache-control']).toBe('no-store')
      expect(await response.text()).not.toContain('PRIVATE_OWNER')
      expect(Object.keys(await response.json()).sort()).toEqual(['error', 'message', 'statusCode', 'statusMessage'])
    }
    const otherProfile = await otherContext.request.get('/api/v1/profile')
    expect((await otherProfile.json()).user.id).toBe(other.id)
    const otherApplications = await otherContext.request.get('/api/v1/applications')
    expect((await otherApplications.json()).items).toEqual([])
    const otherVacancy = await otherContext.request.get(`/api/v1/vacancies/${vacancyID}/application`)
    expect((await otherVacancy.json()).application).toBeNull()
    const publicRole = await otherContext.request.get(`/api/v1/vacancies/${slug}`)
    expect(publicRole.status()).toBe(200)
    expect(await publicRole.text()).not.toContain('PRIVATE_OWNER')
    const queue = await adminContext.request.get('/api/v1/admin/applications')
    for (const value of ['PRIVATE_OWNER_CONTACT', 'PRIVATE_OWNER_ABOUT', 'PRIVATE_OWNER_NOTE', 'PRIVATE_INTERNAL']) expect(await queue.text()).not.toContain(value)
    const detail = await adminContext.request.get(`/api/v1/admin/applications/${id}`)
    expect(detail.status()).toBe(200); expect(await detail.text()).toContain('PRIVATE_INTERNAL_NOTE')
    expect((await context.request.get(`/api/v1/admin/applications/${id}`)).status()).toBe(403)
    await sql`update users set role='USER' where id=${admin.id}`
    for (const suffix of ['', '/package']) {
      const denied = await adminContext.request.get(`/api/v1/admin/applications/${id}${suffix}`)
      expect(denied.status()).toBe(403); expect(denied.headers()['cache-control']).toBe('no-store')
      expect(await denied.text()).not.toContain('PRIVATE_')
    }
    expect((await sql`select user_id from applications where id=${id}`)[0]!.user_id).toBe(owner.id)
  } finally { await otherContext.close(); await adminContext.close() }
})
