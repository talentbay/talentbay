import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { createApplication, withdrawApplication, listCandidateApplications, candidateApplicationForVacancy } from '#server/services/candidates/applications'
import { candidateApplicationProgress } from '#server/services/candidates/application-progress'
import { handleApplication, prepareApplicationPackage } from '#server/services/admin/application-handling'
import type { ApplicationCommand } from '#shared/schemas/application-command'
import { applicationDisclosureVersion } from '#shared/types/application-handling'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const users: number[] = []
const companies: number[] = []
let operatorID: number, otherID: number
const base = (revision: number) => ({ expectedRevision: revision, commandKey: randomUUID() })
const contact = () => ({ channel: 'EMAIL' as const, occurredAt: new Date().toISOString(), reference: 'Synthetic test reference' })
async function application(legacy = false) {
  const [user] = await sql`insert into users (name) values ('Handling fixture') returning id`
  users.push(user!.id)
  await sql`insert into candidate_profiles (user_id,telegram) values (${user!.id}, '@handling_fixture')`
  const slug = randomUUID()
  const [company] = await sql`insert into organisations (name,slug,status) values ('Handling fixture',${slug},'ACTIVE') returning id`
  companies.push(company!.id)
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code) values (${company!.id},${slug},'Handling Engineer','Synthetic handling role','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB') returning id`
  const row = legacy
    ? (await sql`insert into applications (user_id,vacancy_id) values (${user!.id},${vacancy!.id}) returning id`)[0]!
    : await createApplication(user!.id, vacancy!.id, { disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true })
  return { id: row.id as number, userID: user!.id as number, vacancyID: vacancy!.id as number, revision: legacy ? 0 : 1 }
}
async function contacted(legacy = false) {
  const row = await application(legacy)
  await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'ASSIGN', assigneeID: operatorID })
  await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'START' })
  await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'CONTACT', ...contact(), privateNote: 'Internal only' })
  return row
}
beforeAll(async () => {
  vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Handling failed'), details))
  for (const name of ['Operator fixture', 'Other operator fixture']) {
    const [user] = await sql`insert into users (name,role) values (${name},'ADMIN') returning id`
    users.push(user!.id)
  }
  ;[operatorID, otherID] = users as [number, number]
})
afterAll(async () => {
  await closeDatabase()
  if (users.length) await sql`delete from users where id in ${sql(users)}`
  if (companies.length) {
    await sql`delete from vacancies where organisation_id in ${sql(companies)}`
    await sql`delete from organisations where id in ${sql(companies)}`
  }
  await sql.end()
  vi.unstubAllGlobals()
})

describe('serialized manual application handling', () => {
  it('assigns, starts and contacts without changing the employer stage or writing on package preview', async () => {
    const row = await contacted()
    const before = await sql`select id from application_handling_events where application_id=${row.id}`
    const packet = await prepareApplicationPackage(operatorID, row.id)
    expect(packet.snapshot.recipient.name).toBe('Handling fixture')
    expect(packet.snapshot.candidate.profile.telegram).toBe('@handling_fixture')
    expect(await sql`select id from application_handling_events where application_id=${row.id}`).toHaveLength(before.length)
    expect((await sql`select status,handling_stage,handling_revision from applications where id=${row.id}`)[0]).toEqual({ status: 'NEW', handling_stage: 'CONTACTED', handling_revision: row.revision })
    await expect(prepareApplicationPackage(otherID, row.id)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('records one manual handoff, replaying the same command but rejecting a changed payload/key reuse', async () => {
    const row = await contacted()
    const command: ApplicationCommand = { ...base(row.revision), action: 'SHARE', ...contact(), confirmCompleted: true }
    const result = await handleApplication(operatorID, row.id, command)
    expect(await handleApplication(operatorID, row.id, command)).toMatchObject({ eventID: result.eventID, revision: result.revision, replayed: true })
    await expect(handleApplication(operatorID, row.id, { ...command, privateNote: 'Different command' })).rejects.toMatchObject({ statusCode: 409 })
    await handleApplication(operatorID, row.id, { ...base(result.revision), action: 'FOLLOW_UP' })
    await expect(prepareApplicationPackage(operatorID, row.id)).rejects.toMatchObject({ statusCode: 409 })
    await expect(handleApplication(operatorID, row.id, { ...command, ...base(result.revision + 1) })).rejects.toMatchObject({ statusCode: 409 })
    expect(await sql`select id from application_handling_events where application_id=${row.id} and kind='SHARED'`).toHaveLength(1)
    expect((await sql`select status from applications where id=${row.id}`)[0]!.status).toBe('NEW')
  })

  it('serializes two operator writes and rejects stale revisions without overwriting ownership', async () => {
    const row = await application()
    const results = await Promise.allSettled([
      handleApplication(operatorID, row.id, { ...base(row.revision), action: 'ASSIGN', assigneeID: operatorID }),
      handleApplication(otherID, row.id, { ...base(row.revision), action: 'ASSIGN', assigneeID: otherID }),
    ])
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    const failed = results.find(result => result.status === 'rejected') as PromiseRejectedResult
    expect(failed.reason).toMatchObject({ statusCode: 409 })
    expect(await sql`select id from application_handling_events where application_id=${row.id} and kind='ASSIGNED'`).toHaveLength(1)
  })

  it('never allows legacy, changed or unpublished application packages to be shared', async () => {
    const legacy = await contacted(true)
    await expect(prepareApplicationPackage(operatorID, legacy.id)).rejects.toMatchObject({ statusCode: 409 })
    const row = await contacted()
    await sql`update vacancies set updated_at=updated_at + interval '1 second' where id=${row.vacancyID}`
    await expect(prepareApplicationPackage(operatorID, row.id)).rejects.toMatchObject({ statusCode: 409 })
    await expect(handleApplication(operatorID, row.id, { ...base(row.revision), action: 'SHARE', ...contact(), confirmCompleted: true })).rejects.toMatchObject({ statusCode: 409 })
    const hidden = await contacted()
    await sql`update vacancies set status='ARCHIVED' where id=${hidden.vacancyID}`
    await expect(prepareApplicationPackage(operatorID, hidden.id)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('rechecks current actor and target roles even when a stale ADMIN session might exist', async () => {
    const row = await application()
    await sql`update users set role='USER' where id=${otherID}`
    try {
      await expect(handleApplication(otherID, row.id, { ...base(row.revision), action: 'ASSIGN', assigneeID: operatorID })).rejects.toMatchObject({ statusCode: 403 })
      await expect(handleApplication(operatorID, row.id, { ...base(row.revision), action: 'ASSIGN', assigneeID: otherID })).rejects.toMatchObject({ statusCode: 403 })
      expect(await sql`select id from application_handling_events where application_id=${row.id} and kind='ASSIGNED'`).toHaveLength(0)
    } finally { await sql`update users set role='ADMIN' where id=${otherID}` }
  })

  it('checks stage, assignee and actual times and rolls back failures', async () => {
    const row = await application()
    await expect(handleApplication(operatorID, row.id, { ...base(row.revision), action: 'START' })).rejects.toMatchObject({ statusCode: 409 })
    await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'ASSIGN', assigneeID: operatorID })
    await expect(handleApplication(operatorID, row.id, { ...base(row.revision), action: 'CONTACT', ...contact() })).rejects.toMatchObject({ statusCode: 409 })
    await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'START' })
    await expect(handleApplication(operatorID, row.id, { ...base(row.revision), action: 'CONTACT', ...contact(), occurredAt: '2099-01-01T00:00:00Z' })).rejects.toMatchObject({ statusCode: 400 })
    expect((await sql`select handling_revision from applications where id=${row.id}`)[0]!.handling_revision).toBe(row.revision)
  })

  it('withdrawal and manual share have one serialization order; nothing can be shared after withdrawal', async () => {
    const row = await contacted()
    const results = await Promise.allSettled([
      withdrawApplication(row.userID, row.id),
      handleApplication(operatorID, row.id, { ...base(row.revision), action: 'SHARE', ...contact(), confirmCompleted: true }),
    ])
    expect(results[0]!.status).toBe('fulfilled')
    const events = await sql`select kind,revision from application_handling_events where application_id=${row.id} order by revision`
    const withdrawal = events.find(event => event.kind === 'WITHDRAWN')!
    expect(events.filter(event => event.revision > withdrawal.revision && event.kind === 'SHARED')).toHaveLength(0)
    await expect(prepareApplicationPackage(operatorID, row.id)).rejects.toMatchObject({ statusCode: 409 })
    expect((await sql`select status,handling_stage from applications where id=${row.id}`)[0]).toEqual({ status: 'WITHDRAWN', handling_stage: 'CLOSED' })
  })

  it('projects only owned public facts with bounded history and no private operator payload', async () => {
    const row = await contacted()
    await expect(candidateApplicationProgress(otherID, row.id)).rejects.toMatchObject({ statusCode: 404 })
    for (let n = 0; n < 28; n++) await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'FOLLOW_UP', privateNote: 'Never expose this private note' })
    const first = await candidateApplicationProgress(row.userID, row.id)
    expect(first.events).toHaveLength(25)
    expect(first.nextCursor).not.toBeNull()
    const second = await candidateApplicationProgress(row.userID, row.id, first.nextCursor!)
    expect(second.events).toHaveLength(6)
    expect(second.nextCursor).toBeNull()
    expect(new Set([...first.events, ...second.events].map(event => event.revision)).size).toBe(31)
    expect(JSON.stringify([first, second])).not.toMatch(/privateNote|actorUserID|assignedUserID|commandKey|digest|channel|reference|Internal only|Never expose|Synthetic test/)
    expect(first.handoffRecorded).toBe(false)
  })

  it('paginates all candidate applications without losing an older vacancy duplicate check', async () => {
    const row = await application()
    const [vacancy] = await sql`select organisation_id from vacancies where id=${row.vacancyID}`
    for (let n = 0; n < 27; n++) {
      const [next] = await sql`insert into vacancies (organisation_id,slug,title,description,employment_type,workplace_type,country_code) values (${vacancy!.organisation_id},${randomUUID()},'Pagination role','Synthetic pagination','FULL_TIME','REMOTE','GB') returning id`
      await sql`insert into applications (user_id,vacancy_id,handling_stage) values (${row.userID},${next!.id},${n < 3 ? 'CLOSED' : 'RECEIVED'})`
    }
    const first = await listCandidateApplications(row.userID)
    expect(first.items).toHaveLength(25)
    expect(first.counts).toEqual({ all: 28, active: 25, closed: 3 })
    expect(first.items.some(item => item.id === row.id)).toBe(false)
    const second = await listCandidateApplications(row.userID, { before: first.nextCursor! })
    expect(second.items).toHaveLength(3)
    expect(second.nextCursor).toBeNull()
    expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(28)
    expect((await candidateApplicationForVacancy(row.userID, row.vacancyID)).application!.id).toBe(row.id)
    expect((await candidateApplicationForVacancy(otherID, row.vacancyID)).application).toBeNull()
    const closed = await listCandidateApplications(row.userID, { status: 'closed' })
    expect(closed.total).toBe(3)
    expect(closed.items.every(item => item.handling.stage === 'CLOSED')).toBe(true)
    expect(JSON.stringify(first)).not.toMatch(/assignedUserID|actorUserID|privateNote|submissionSnapshot/)
  })

  it('closes handling with a truthful public reason, never an invented employer rejection', async () => {
    const row = await contacted()
    await handleApplication(operatorID, row.id, { ...base(row.revision), action: 'CLOSE', reason: 'NO_RESPONSE', privateNote: 'Private closure detail' })
    const progress = await candidateApplicationProgress(row.userID, row.id)
    expect(progress.stage).toBe('CLOSED')
    expect(progress.events[0]).toMatchObject({ kind: 'CLOSED', closeReason: 'NO_RESPONSE' })
    expect(JSON.stringify(progress)).not.toContain('Private closure detail')
    expect((await sql`select status from applications where id=${row.id}`)[0]!.status).toBe('NEW')
    await expect(handleApplication(operatorID, row.id, { ...base(row.revision + 1), action: 'START' })).rejects.toMatchObject({ statusCode: 409 })
    // Closing TalentBay handling does not revoke the candidate's right to withdraw.
    expect((await withdrawApplication(row.userID, row.id)).status).toBe('WITHDRAWN')
  })
})
