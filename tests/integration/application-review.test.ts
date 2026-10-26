import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { applicationQueueQuery, getAdminApplication, listAdminApplications } from '#server/services/admin/applications'
import { listCandidateApplications, withdrawApplication } from '#server/services/candidates/applications'

const suffix = randomUUID()
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const users: number[] = []
const applications: number[] = []
let vacancyID: number, companyID: number
beforeAll(async () => {
  vi.stubGlobal('createError', (input: object) => Object.assign(new Error('Application operation failed'), input))
  const [company] = await sql`insert into organisations (name, slug, status) values ('Review fixture', ${suffix}, 'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id, slug, title, description, status, review_status, employment_type, workplace_type, country_code) values (${companyID}, ${suffix}, 'Review Engineer', 'Synthetic review fixture.', 'PUBLISHED', 'VERIFIED', 'FULL_TIME', 'REMOTE', 'DE') returning id`
  vacancyID = vacancy!.id
  for (let n = 0; n < 28; n++) {
    const [user] = await sql`insert into users (name) values (${`Review fixture ${suffix} ${n}`}) returning id`
    users.push(user!.id)
    const [item] = await sql`insert into applications (user_id, vacancy_id, cover_letter) values (${user!.id}, ${vacancyID}, 'Private cover note') returning id`
    applications.push(item!.id)
  }
  await sql`insert into candidate_profiles (user_id, headline, phone) values (${users[0]!}, 'Review profile', 'Private contact')`
})
afterAll(async () => {
  await closeDatabase()
  if (users.length) await sql`delete from users where id in ${sql(users)}`
  if (vacancyID) await sql`delete from vacancies where id = ${vacancyID}`
  if (companyID) await sql`delete from organisations where id = ${companyID}`
  await sql.end()
  vi.unstubAllGlobals()
})

describe('minimal application operations', () => {
  it('uses bounded keyset pages without contact data in the queue', async () => {
    const first = await listAdminApplications({ status: 'NEW' })
    expect(first.items).toHaveLength(25)
    expect(first.nextCursor).toBe(first.items.at(-1)!.id)
    const second = await listAdminApplications({ status: 'NEW', before: first.nextCursor! })
    expect(second.items).toHaveLength(3)
    expect(second.nextCursor).toBeNull()
    expect(new Set([...first.items, ...second.items].map(row => row.id)).size).toBe(28)
    expect(JSON.stringify(first)).not.toMatch(/Private contact|Private cover note|email|provider/)
    for (const query of [{ status: 'OTHER' }, { before: '-1' }, { before: '1.2' }, { before: ['1', '2'] }, { before: '2147483648' }]) expect(applicationQueueQuery.safeParse(query).success).toBe(false)
  })

  it('reads the current profile and cover note without marking a record reviewed', async () => {
    const detail = await getAdminApplication(applications[0]!)
    expect(detail).toMatchObject({ status: 'NEW', coverLetter: 'Private cover note', candidate: { profile: { headline: 'Review profile', phone: 'Private contact' } } })
    expect(detail.candidate.user.email).toBeNull()
    expect((await listCandidateApplications(users[0]!)).items[0]!.status).toBe('NEW')
    await expect(getAdminApplication(2147483647)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('repeated operator reads never invent employer progress', async () => {
    await getAdminApplication(applications[0]!)
    await getAdminApplication(applications[0]!)
    expect((await listCandidateApplications(users[0]!)).items[0]!.status).toBe('NEW')
  })

  it('withdraws only owned applications; retries do not reopen them', async () => {
    await expect(withdrawApplication(users[1]!, applications[0]!)).rejects.toMatchObject({ statusCode: 404 })
    expect((await withdrawApplication(users[0]!, applications[0]!)).status).toBe('WITHDRAWN')
    expect((await withdrawApplication(users[0]!, applications[0]!)).status).toBe('WITHDRAWN')
    await sql`update applications set status = 'REJECTED' where id = ${applications[1]!}`
    await expect(withdrawApplication(users[1]!, applications[1]!)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('simultaneous withdrawal retries and operator reads retain a single closed record', async () => {
    await Promise.all([getAdminApplication(applications[2]!), ...Array.from({ length: 5 }, () => withdrawApplication(users[2]!, applications[2]!))])
    const [row] = await sql`select status, cover_letter from applications where id = ${applications[2]!}`
    expect(row).toMatchObject({ status: 'WITHDRAWN', cover_letter: 'Private cover note' })
    expect(await sql`select id from applications where vacancy_id = ${vacancyID}`).toHaveLength(28)
  })
})
