import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { createApplication, withdrawApplication } from '#server/services/candidates/applications'
import { getAdminApplication } from '#server/services/admin/applications'
import { applicationDisclosureVersion } from '#shared/types/application-handling'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const suffix = randomUUID()
const users: number[] = []
const input = { disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true as const, coverLetter: 'Original cover note.' }
let vacancyID: number, companyID: number

async function candidate(profile = true) {
  const [row] = await sql`insert into users (name) values ('Snapshot Fixture') returning id`
  users.push(row!.id)
  if (profile) await sql`insert into candidate_profiles (user_id, headline, telegram) values (${row!.id}, 'Original headline', '@snapshot_fixture')`
  return row!.id as number
}
beforeAll(async () => {
  vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Application operation failed'), details))
  const [company] = await sql`insert into organisations (name,slug,status) values ('Original Snapshot Company',${suffix},'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code) values (${companyID},${suffix},'Original Snapshot Role','A synthetic role.','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','DE') returning id`
  vacancyID = vacancy!.id
})
afterAll(async () => {
  await closeDatabase()
  if (users.length) await sql`delete from users where id in ${sql(users)}`
  if (vacancyID) await sql`delete from vacancies where id=${vacancyID}`
  if (companyID) await sql`delete from organisations where id=${companyID}`
  await sql.end()
  vi.unstubAllGlobals()
})

describe('immutable managed-application intake', () => {
  it('creates one receipt and snapshot; later profile/role edits cannot change the submitted package', async () => {
    const userID = await candidate()
    const application = await createApplication(userID, vacancyID, input)
    const before = await getAdminApplication(application.id)
    expect(before.submissionSnapshot).toMatchObject({ candidate: { email: null, profile: { headline: 'Original headline', telegram: '@snapshot_fixture' } }, recipient: { organisationID: companyID, name: 'Original Snapshot Company' }, vacancy: { id: vacancyID, title: 'Original Snapshot Role' } })
    await sql`update candidate_profiles set headline='Changed headline', telegram='@different_fixture' where user_id=${userID}`
    await sql`update vacancies set title='Changed role' where id=${vacancyID}`
    const after = await getAdminApplication(application.id)
    expect(after.submissionSnapshot).toEqual(before.submissionSnapshot)
    expect(after.candidate.profile!.headline).toBe('Original headline')
    expect(after.vacancy.title).toBe('Original Snapshot Role')
    expect(after.status).toBe('NEW')
    const events = await sql`select kind,revision,actor_user_id from application_handling_events where application_id=${application.id}`
    expect(events).toEqual([{ kind: 'RECEIVED', revision: 1, actor_user_id: userID }])
  })

  it('rejects missing profile/contact without creating an application or receipt', async () => {
    const userID = await candidate(false)
    await expect(createApplication(userID, vacancyID, input)).rejects.toMatchObject({ statusCode: 422 })
    await sql`insert into candidate_profiles (user_id,github_url,telegram) values (${userID},'https://example.invalid/cv',' ')`
    await expect(createApplication(userID, vacancyID, input)).rejects.toMatchObject({ statusCode: 422 })
    expect(await sql`select id from applications where user_id=${userID}`).toHaveLength(0)
    expect(await sql`select id from application_handling_events where actor_user_id=${userID}`).toHaveLength(0)
  })

  it('serializes concurrent submission retries and withdrawal without duplicating events', async () => {
    const userID = await candidate()
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => createApplication(userID, vacancyID, input)))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    for (const result of results) if (result.status === 'rejected') expect(result.reason).toMatchObject({ statusCode: 409 })
    const [row] = await sql`select id from applications where user_id=${userID}`
    await Promise.all(Array.from({ length: 4 }, () => withdrawApplication(userID, row!.id)))
    expect(await sql`select kind,revision from application_handling_events where application_id=${row!.id} order by revision`).toEqual([{ kind: 'RECEIVED', revision: 1 }, { kind: 'WITHDRAWN', revision: 2 }])
    expect((await sql`select status,handling_stage,handling_revision from applications where id=${row!.id}`)[0]).toEqual({ status: 'WITHDRAWN', handling_stage: 'CLOSED', handling_revision: 2 })
  })

  it('preserves legacy rows without inventing a snapshot, acknowledgment or earlier history', async () => {
    const userID = await candidate()
    const [row] = await sql`insert into applications (user_id,vacancy_id) values (${userID},${vacancyID}) returning id`
    expect((await getAdminApplication(row!.id)).submissionSnapshot).toBeNull()
    expect(await sql`select id from application_handling_events where application_id=${row!.id}`).toHaveLength(0)
    await withdrawApplication(userID, row!.id)
    expect(await sql`select kind,revision from application_handling_events where application_id=${row!.id}`).toEqual([{ kind: 'WITHDRAWN', revision: 1 }])
  })
})
