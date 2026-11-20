import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { createApplication, withdrawApplication } from '#server/services/candidates/applications'
import { getAdminApplication } from '#server/services/admin/applications'
import { applicationInputFor } from './helpers/application-input'
import { getVacancyBySlug } from '#server/repositories/vacancies'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const suffix = randomUUID()
const users: number[] = []
const replacementCompanies: number[] = []
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
  if (replacementCompanies.length) await sql`delete from organisations where id in ${sql(replacementCompanies)}`
  await sql.end()
  vi.unstubAllGlobals()
})

describe('immutable managed-application intake', () => {
  it('creates one receipt and snapshot; later profile/role edits cannot change the submitted package', async () => {
    const userID = await candidate()
    const application = await createApplication(userID, vacancyID, { ...await applicationInputFor(vacancyID, userID), coverLetter: 'Original cover note.' })
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
    const input = await applicationInputFor(vacancyID, userID)
    await expect(createApplication(userID, vacancyID, input)).rejects.toMatchObject({ statusCode: 422 })
    await sql`insert into candidate_profiles (user_id,github_url,telegram) values (${userID},'https://example.invalid/cv',' ')`
    const current = await applicationInputFor(vacancyID, userID)
    await expect(createApplication(userID, vacancyID, current)).rejects.toMatchObject({ statusCode: 422 })
    expect(await sql`select id from applications where user_id=${userID}`).toHaveLength(0)
    expect(await sql`select id from application_handling_events where actor_user_id=${userID}`).toHaveLength(0)
  })

  it('keeps the reviewed candidate data as the precondition even when the vacancy is unchanged', async () => {
    const userID = await candidate()
    const original = await applicationInputFor(vacancyID, userID)
    await sql`update candidate_profiles set telegram='@new_snapshot_fixture' where user_id=${userID}`
    await expect(createApplication(userID, vacancyID, original)).rejects.toMatchObject({ statusCode: 412 })
    const updatedContact = await applicationInputFor(vacancyID, userID)
    expect(updatedContact.expectedContext).toBe(original.expectedContext)
    expect(updatedContact.expectedCandidateContext).not.toBe(original.expectedCandidateContext)
    await sql`update users set name='Revised name' where id=${userID}`
    await expect(createApplication(userID, vacancyID, updatedContact)).rejects.toMatchObject({ statusCode: 412 })
    expect(await sql`select id from applications where user_id=${userID}`).toHaveLength(0)
    expect(await sql`select id from application_handling_events where actor_user_id=${userID}`).toHaveLength(0)
    const renewed = await applicationInputFor(vacancyID, userID)
    await sql`update candidate_profiles set telegram=telegram, updated_at=now() where user_id=${userID}`
    await sql`update users set avatar_url='https://example.invalid/avatar', updated_at=now() where id=${userID}`
    const receipt = await createApplication(userID, vacancyID, renewed)
    expect((await getAdminApplication(receipt.id)).submissionSnapshot?.candidate).toMatchObject({ name: 'Revised name', profile: { telegram: '@new_snapshot_fixture' } })
  })

  it('distinguishes candidates with identical displayed profile fields', async () => {
    const first = await candidate(), second = await candidate()
    const reviewed = await applicationInputFor(vacancyID, first)
    const other = await applicationInputFor(vacancyID, second)
    expect(other.expectedCandidateContext).not.toBe(reviewed.expectedCandidateContext)
    await expect(createApplication(second, vacancyID, reviewed)).rejects.toMatchObject({ statusCode: 412 })
    expect(await sql`select id from applications where user_id in ${sql([first, second])}`).toHaveLength(0)
    expect(await sql`select id from application_handling_events where actor_user_id in ${sql([first, second])}`).toHaveLength(0)
  })

  it('serializes concurrent submission retries and withdrawal without duplicating events', async () => {
    const userID = await candidate()
    const input = await applicationInputFor(vacancyID, userID)
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => createApplication(userID, vacancyID, input)))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    for (const result of results) if (result.status === 'rejected') expect(result.reason).toMatchObject({ statusCode: 409 })
    const [row] = await sql`select id from applications where user_id=${userID}`
    await Promise.all(Array.from({ length: 4 }, () => withdrawApplication(userID, row!.id)))
    expect(await sql`select kind,revision from application_handling_events where application_id=${row!.id} order by revision`).toEqual([{ kind: 'RECEIVED', revision: 1 }, { kind: 'WITHDRAWN', revision: 2 }])
    expect((await sql`select status,handling_stage,handling_revision from applications where id=${row!.id}`)[0]).toEqual({ status: 'WITHDRAWN', handling_stage: 'CLOSED', handling_revision: 2 })
  })

  it('rejects stale displayed content or recipient without an application or receipt, then accepts renewed review', async () => {
    const userID = await candidate()
    const shown = await getVacancyBySlug(suffix)
    const input = { ...await applicationInputFor(vacancyID, userID), expectedContext: shown!.applicationContext! }
    for (const mutation of ['role', 'company'] as const) {
      if (mutation === 'role') await sql`update vacancies set description=description || ' Changed duties.' where id=${vacancyID}`
      else await sql`update organisations set name='Different recipient' where id=${companyID}`
      await expect(createApplication(userID, vacancyID, input)).rejects.toMatchObject({ statusCode: 412 })
      expect(await sql`select id from applications where user_id=${userID}`).toHaveLength(0)
      expect(await sql`select id from application_handling_events where actor_user_id=${userID}`).toHaveLength(0)
    }
    const refreshed = await getVacancyBySlug(suffix)
    expect(refreshed!.applicationContext).not.toBe(input.expectedContext)
    await sql`update candidate_profiles set about='Revised introduction' where user_id=${userID}`
    const renewed = await applicationInputFor(vacancyID, userID)
    await expect(createApplication(userID, vacancyID, { ...input, expectedContext: refreshed!.applicationContext! }))
      .rejects.toMatchObject({ statusCode: 412, data: { code: 'CANDIDATE_REVIEW_REQUIRED' } })
    await expect(createApplication(userID, vacancyID, { ...input, expectedCandidateContext: renewed.expectedCandidateContext }))
      .rejects.toMatchObject({ statusCode: 412 })
    expect(await sql`select id from application_handling_events where actor_user_id=${userID}`).toHaveLength(0)
    const accepted = await createApplication(userID, vacancyID, renewed)
    expect((await getAdminApplication(accepted.id)).submissionSnapshot).toMatchObject({ recipient: { name: 'Different recipient' }, vacancy: { contextRevision: refreshed!.applicationContext } })
  })

  it('binds the actual recipient ID even when a replacement company has the same displayed name', async () => {
    const userID = await candidate()
    const input = await applicationInputFor(vacancyID, userID)
    const [replacement] = await sql`insert into organisations (name,slug,status) select name,${randomUUID()},'ACTIVE' from organisations where id=${companyID} returning id`
    replacementCompanies.push(replacement!.id)
    try {
      await sql`update vacancies set organisation_id=${replacement!.id} where id=${vacancyID}`
      await expect(createApplication(userID, vacancyID, input)).rejects.toMatchObject({ statusCode: 412 })
      expect(await sql`select id from applications where user_id=${userID}`).toHaveLength(0)
    } finally { await sql`update vacancies set organisation_id=${companyID} where id=${vacancyID}` }
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
