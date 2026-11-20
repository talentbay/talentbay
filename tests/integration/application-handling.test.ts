import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { createApplication, withdrawApplication, listCandidateApplications, getCandidateApplication, candidateApplicationForVacancy } from '#server/services/candidates/applications'
import { candidateApplicationProgress } from '#server/services/candidates/application-progress'
import { handleApplication, prepareApplicationPackage } from '#server/services/admin/application-handling'
import { getAdminApplication } from '#server/services/admin/applications'
import type { ApplicationCommand } from '#shared/schemas/application-command'
import { applicationInputFor } from './helpers/application-input'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'

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
    : await createApplication(user!.id, vacancy!.id, await applicationInputFor(vacancy!.id))
  return { id: row.id as number, userID: user!.id as number, vacancyID: vacancy!.id as number, revision: legacy ? 0 : 1 }
}
async function contacted(legacy = false) {
  const row = await application(legacy)
  await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'ASSIGN', assigneeID: operatorID })
  await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'START' })
  await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'CONTACT', ...contact(), privateNote: 'Internal only' })
  return row
}
async function expectNoResponseDenied(id: number, revision: number) {
  const readState = async () => (await sql`
    select handling_revision, handling_stage,
      array(select id from application_handling_events where application_id=a.id order by revision) as journal
    from applications a where id=${id}`)[0]!
  const before = await readState()
  expect(before.handling_revision).toBe(revision)
  await expect(handleApplication(operatorID, id, { ...base(revision), action: 'CLOSE', reason: 'NO_RESPONSE' }))
    .rejects.toMatchObject({ statusCode: 409 })
  expect(await readState()).toEqual(before)
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
  it('keeps an unchanged rechecked listing shareable without rewriting the submitted snapshot', async () => {
    const row = await contacted()
    const before = await prepareApplicationPackage(operatorID, row.id)
    await reviewVacancy(row.vacancyID, { status: 'PUBLISHED', reviewStatus: 'VERIFIED' }, undefined, operatorID)
    await expect(prepareApplicationPackage(operatorID, row.id)).resolves.toEqual(before)
  })
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
    await sql`update vacancies set description='Materially different duties', updated_at=updated_at + interval '1 second' where id=${row.vacancyID}`
    await expect(prepareApplicationPackage(operatorID, row.id)).rejects.toMatchObject({ statusCode: 409 })
    await expect(handleApplication(operatorID, row.id, { ...base(row.revision), action: 'SHARE', ...contact(), confirmCompleted: true })).rejects.toMatchObject({ statusCode: 409 })
    const hidden = await contacted()
    await sql`update vacancies set status='ARCHIVED' where id=${hidden.vacancyID}`
    await expect(prepareApplicationPackage(operatorID, hidden.id)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('preserves timestamp-only legacy eligibility on an unchanged recheck, without inventing new consent', async () => {
    const row = await contacted()
    await sql`update applications set submission_snapshot=submission_snapshot #- '{vacancy,contextRevision}' where id=${row.id}`
    const before = await prepareApplicationPackage(operatorID, row.id)
    await reviewVacancy(row.vacancyID, { status: 'PUBLISHED', reviewStatus: 'VERIFIED' }, undefined, operatorID)
    await expect(prepareApplicationPackage(operatorID, row.id)).resolves.toEqual(before)
    expect(before.snapshot.vacancy.contextRevision).toBeUndefined()
    await sql`update vacancies set title='Changed legacy duties',updated_at=updated_at+interval '1 second' where id=${row.vacancyID}`
    await expect(prepareApplicationPackage(operatorID, row.id)).rejects.toMatchObject({ statusCode: 409 })
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

  it('paginates history without losing owner-only receipt lookup or an older vacancy duplicate check', async () => {
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

    const receipt = second.items.find(item => item.id === row.id)!
    expect(receipt.publicVacancySlug).toBe(receipt.vacancy!.slug)
    await expect(getCandidateApplication(row.userID, row.id)).resolves.toEqual(receipt)
    const legacy = first.items[0]!
    expect(legacy.vacancy).toBeNull()
    await expect(getCandidateApplication(row.userID, legacy.id)).resolves.toEqual(legacy)

    await sql`update vacancies set status='ARCHIVED', title='Changed after submission' where id=${row.vacancyID}`
    await expect(getCandidateApplication(row.userID, row.id)).resolves.toEqual({ ...receipt, publicVacancySlug: null })
    const notFound = { statusCode: 404, statusMessage: 'Application not found' }
    await expect(getCandidateApplication(otherID, row.id)).rejects.toMatchObject(notFound)
    await expect(getCandidateApplication(row.userID, 2_147_483_647)).rejects.toMatchObject(notFound)
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

  it('requires contact evidence on this application regardless of assignment, stage or contacts elsewhere', async () => {
    const row = await application()
    await expect(getAdminApplication(row.id)).resolves.toMatchObject({ hasUncorrectedContact: false, handoffRecorded: false, handoffCorrected: false })
    await expectNoResponseDenied(row.id, row.revision)
    await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'ASSIGN', assigneeID: operatorID })
    await expectNoResponseDenied(row.id, row.revision)
    const other = await contacted()
    await expect(getAdminApplication(other.id)).resolves.toMatchObject({ hasUncorrectedContact: true })
    await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'START' })
    await expectNoResponseDenied(row.id, row.revision)
    // A historical stage without a CONTACTED journal entry is not evidence of contact.
    await sql`update applications set handling_stage='CONTACTED' where id=${row.id}`
    await expect(getAdminApplication(row.id)).resolves.toMatchObject({ hasUncorrectedContact: false })
    await expectNoResponseDenied(row.id, row.revision)
  })

  it('keeps a NO_RESPONSE reason supported by an independent contact until that contact is also corrected', async () => {
    const row = await contacted()
    const first = row.revision
    const second = await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'CONTACT', ...contact(), reference: 'Second synthetic contact' })
    const correct = (targetRevision: number) => handleApplication(otherID, row.id, {
      ...base(row.revision++), action: 'CORRECT', targetRevision, reason: 'RECORDED_IN_ERROR', privateNote: 'Synthetic contact correction',
    })
    await correct(second.revision)
    await expect(getAdminApplication(row.id)).resolves.toMatchObject({ hasUncorrectedContact: true, handoffRecorded: false, handoffCorrected: false })
    const closed = await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'CLOSE', reason: 'NO_RESPONSE' })
    const publicClosure = async () => (await candidateApplicationProgress(row.userID, row.id)).events.find(event => event.revision === closed.revision)
    expect(await publicClosure()).toMatchObject({ kind: 'CLOSED', closeReason: 'NO_RESPONSE' })
    await correct(first)
    const admin = await getAdminApplication(row.id)
    expect(admin).toMatchObject({ hasUncorrectedContact: false, handoffCorrected: false })
    expect(admin.events.find(event => event.id === closed.eventID)).toMatchObject({ kind: 'CLOSED', data: { closeReason: 'NO_RESPONSE' } })
    expect(await publicClosure()).toMatchObject({ kind: 'CLOSED', closeReason: null })
    await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'REOPEN', privateNote: 'Resume synthetic review' })
    await expectNoResponseDenied(row.id, row.revision)
  })

  it('never backfills evidence for a historical closure from a later contact', async () => {
    const row = await application()
    // Seed a closure allowed by the previous policy; the current command must not create it.
    const [historic] = await sql`with closed as (
      update applications set handling_stage='CLOSED', handling_revision=handling_revision+1, assigned_user_id=${operatorID}
      where id=${row.id} returning id, handling_revision
    ) insert into application_handling_events (application_id,revision,kind,stage,actor_user_id,data)
      select id,handling_revision,'CLOSED','CLOSED',${operatorID},'{"closeReason":"NO_RESPONSE"}'::jsonb from closed returning revision`
    const historicRevision = historic!.revision as number
    const history = () => candidateApplicationProgress(row.userID, row.id)
    expect((await history()).events.find(event => event.revision === historicRevision)).toMatchObject({ kind: 'CLOSED', closeReason: null })
    const reopened = await handleApplication(operatorID, row.id, { ...base(historicRevision), action: 'REOPEN', privateNote: 'Resume synthetic review' })
    const fact = await handleApplication(operatorID, row.id, { ...base(reopened.revision), action: 'CONTACT', ...contact() })
    const later = await handleApplication(operatorID, row.id, { ...base(fact.revision), action: 'CLOSE', reason: 'NO_RESPONSE' })
    const publicClosures = (await history()).events.filter(event => event.kind === 'CLOSED')
    expect(publicClosures.map(event => [event.revision, event.closeReason])).toEqual([[later.revision, 'NO_RESPONSE'], [historicRevision, null]])
    const admin = await getAdminApplication(row.id)
    expect(admin.events.find(event => event.revision === historicRevision)).toMatchObject({ kind: 'CLOSED', data: { closeReason: 'NO_RESPONSE' } })
  })

  it('appends correction without overwriting the original or granting another handoff', async () => {
    const row = await contacted()
    const shared = await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'SHARE', ...contact(), confirmCompleted: true })
    const uncorrected = { handoffRecorded: true, handoffCorrected: false }
    await expect(getAdminApplication(row.id)).resolves.toMatchObject(uncorrected)
    await expect(candidateApplicationProgress(row.userID, row.id)).resolves.toMatchObject(uncorrected)
    const [original] = await sql`select * from application_handling_events where id=${shared.eventID}`
    const [snapshot] = await sql`select user_id,vacancy_id,status,submission_snapshot from applications where id=${row.id}`
    const command: ApplicationCommand = { ...base(row.revision), action: 'CORRECT', targetRevision: shared.revision, reason: 'RECORDED_IN_ERROR', privateNote: 'Private correction explanation, never public' }
    const corrected = await handleApplication(otherID, row.id, command)
    expect(await handleApplication(otherID, row.id, command)).toMatchObject({ replayed: true, eventID: corrected.eventID })
    // Same revision numbers, but only the contact was corrected on this application.
    const other = await contacted()
    const otherShare = await handleApplication(operatorID, other.id, { ...base(other.revision), action: 'SHARE', ...contact(), confirmCompleted: true })
    expect(otherShare.revision).toBe(shared.revision)
    const otherCorrection = await handleApplication(otherID, other.id, { ...base(otherShare.revision), action: 'CORRECT', targetRevision: other.revision, reason: 'DETAILS_INACCURATE', privateNote: 'Synthetic contact correction' })
    await expect(getAdminApplication(other.id)).resolves.toMatchObject({ ...uncorrected, hasUncorrectedContact: false })
    await expect(candidateApplicationProgress(other.userID, other.id)).resolves.toMatchObject(uncorrected)
    await expectNoResponseDenied(other.id, otherCorrection.revision)
    expect((await sql`select * from application_handling_events where id=${shared.eventID}`)[0]).toEqual(original)
    expect((await sql`select user_id,vacancy_id,status,submission_snapshot from applications where id=${row.id}`)[0]).toEqual(snapshot)
    const progress = await candidateApplicationProgress(row.userID, row.id)
    expect(progress).toMatchObject({ stage: 'IN_PROGRESS', handoffRecorded: true, handoffCorrected: true })
    expect(progress.events[0]).toMatchObject({ kind: 'CORRECTED', correctedRevision: shared.revision, correctionReason: 'RECORDED_IN_ERROR' })
    expect(progress.events.find(event => event.revision === shared.revision)).toMatchObject({ kind: 'SHARED', corrected: true })
    expect(JSON.stringify(progress)).not.toMatch(/privateNote|actorUserID|assignedUserID|channel|reference|Private correction|Internal only/)
    await expect(handleApplication(otherID, row.id, { ...command, ...base(corrected.revision) })).rejects.toMatchObject({ statusCode: 409 })
    const newContact = await handleApplication(operatorID, row.id, { ...base(corrected.revision), action: 'CONTACT', ...contact() })
    // Put both the original handoff and its correction outside the admin (50) and candidate (25) windows.
    const padding = 51
    await sql.begin(async tx => {
      await tx`insert into application_handling_events (application_id,revision,kind,stage,actor_user_id)
        select ${row.id}, ${newContact.revision}::int+n, 'FOLLOW_UP','FOLLOW_UP',${operatorID} from generate_series(1,${padding}::int) as s(n)`
      await tx`update applications set handling_stage='FOLLOW_UP',handling_revision=${newContact.revision + padding} where id=${row.id}`
    })
    const admin = await getAdminApplication(row.id)
    const recent = await candidateApplicationProgress(row.userID, row.id)
    expect(admin).toMatchObject({ eventsTruncated: true, hasUncorrectedContact: true, handoffRecorded: true, handoffCorrected: true })
    expect(recent).toMatchObject({ handoffRecorded: true, handoffCorrected: true })
    expect(admin.events).toHaveLength(50)
    expect(recent.events).toHaveLength(25)
    expect([...admin.events, ...recent.events].every(event => event.kind === 'FOLLOW_UP')).toBe(true)
    await expect(prepareApplicationPackage(operatorID, row.id)).rejects.toMatchObject({ statusCode: 409 })
    await expect(handleApplication(operatorID, row.id, { ...base(newContact.revision + padding), action: 'SHARE', ...contact(), confirmCompleted: true })).rejects.toMatchObject({ statusCode: 409 })
    expect(await sql`select id from application_handling_events where application_id=${row.id} and kind='SHARED'`).toHaveLength(1)
  })

  it('reopens only TalentBay closure, takes current ownership and preserves status/snapshot/withdrawal', async () => {
    const row = await contacted()
    const closed = await handleApplication(operatorID, row.id, { ...base(row.revision), action: 'CLOSE', reason: 'NO_RESPONSE' })
    const [snapshot] = await sql`select submission_snapshot,status from applications where id=${row.id}`
    const command: ApplicationCommand = { ...base(closed.revision), action: 'REOPEN', privateNote: 'Private reason to resume review' }
    const opened = await handleApplication(otherID, row.id, command)
    expect(await handleApplication(otherID, row.id, command)).toMatchObject({ eventID: opened.eventID, replayed: true })
    expect((await sql`select handling_stage,assigned_user_id from applications where id=${row.id}`)[0]).toEqual({ handling_stage: 'IN_PROGRESS', assigned_user_id: otherID })
    expect((await sql`select submission_snapshot,status from applications where id=${row.id}`)[0]).toEqual(snapshot)
    await expect(handleApplication(operatorID, row.id, { ...base(opened.revision), action: 'CONTACT', ...contact() })).rejects.toMatchObject({ statusCode: 409 })
    await withdrawApplication(row.userID, row.id)
    const [withdrawn] = await sql`select handling_revision from applications where id=${row.id}`
    await expect(handleApplication(otherID, row.id, { ...base(withdrawn!.handling_revision), action: 'REOPEN', privateNote: 'Cannot restore revoked permission' })).rejects.toMatchObject({ statusCode: 409 })
    await handleApplication(operatorID, row.id, { ...base(withdrawn!.handling_revision), action: 'CORRECT', targetRevision: closed.revision, reason: 'DETAILS_INACCURATE', privateNote: 'Correct historical reason only' })
    expect((await sql`select status,handling_stage from applications where id=${row.id}`)[0]).toEqual({ status: 'WITHDRAWN', handling_stage: 'CLOSED' })
    await expect(prepareApplicationPackage(otherID, row.id)).rejects.toMatchObject({ statusCode: 409 })
    expect((await candidateApplicationProgress(row.userID, row.id)).events.some(event => event.kind === 'REOPENED')).toBe(true)
  })

  it('marks corrected older pages by application scope, not only the currently loaded page', async () => {
    const row = await contacted()
    const other = await contacted()
    for (let n = 0; n < 30; n++) await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'FOLLOW_UP' })
    await handleApplication(otherID, row.id, { ...base(row.revision), action: 'CORRECT', targetRevision: 4, reason: 'DETAILS_INACCURATE', privateNote: 'Private correction of old contact' })
    const first = await candidateApplicationProgress(row.userID, row.id)
    expect(first.events[0]).toMatchObject({ kind: 'CORRECTED', correctedRevision: 4 })
    expect(first.events.some(event => event.revision === 4)).toBe(false)
    const second = await candidateApplicationProgress(row.userID, row.id, first.nextCursor!)
    expect(second.events.find(event => event.revision === 4)).toMatchObject({ corrected: true })
    expect((await candidateApplicationProgress(other.userID, other.id)).events.find(event => event.revision === 4)).toMatchObject({ corrected: false })
    await expect(getAdminApplication(row.id)).resolves.toMatchObject({ hasUncorrectedContact: false })
    await expect(getAdminApplication(other.id)).resolves.toMatchObject({ hasUncorrectedContact: true })
  })

  it('rejects forbidden targets/rejection/revoked actors and serializes correction or reopening against withdrawal', async () => {
    const row = await contacted()
    for (const targetRevision of [1, 2, 3, 999]) await expect(handleApplication(operatorID, row.id, { ...base(row.revision), action: 'CORRECT', targetRevision, reason: 'RECORDED_IN_ERROR', privateNote: 'Invalid target must not mutate history' })).rejects.toMatchObject({ statusCode: 409 })
    await sql`update users set role='USER' where id=${otherID}`
    try { await expect(handleApplication(otherID, row.id, { ...base(row.revision), action: 'CORRECT', targetRevision: 4, reason: 'RECORDED_IN_ERROR', privateNote: 'Revoked actor cannot correct' })).rejects.toMatchObject({ statusCode: 403 }) }
    finally { await sql`update users set role='ADMIN' where id=${otherID}` }
    const results = await Promise.allSettled([operatorID, otherID].map(actor => handleApplication(actor, row.id, { ...base(row.revision), action: 'CORRECT', targetRevision: 4, reason: 'DETAILS_INACCURATE', privateNote: 'Concurrent correction fixture' })))
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(await sql`select id from application_handling_events where application_id=${row.id} and kind='CORRECTED'`).toHaveLength(1)
    const closed = await handleApplication(operatorID, row.id, { ...base(row.revision + 1), action: 'CLOSE', reason: 'CONTACT_UNAVAILABLE' })
    expect((await candidateApplicationProgress(row.userID, row.id)).events[0]).toMatchObject({ kind: 'CLOSED', closeReason: 'CONTACT_UNAVAILABLE' })
    const race = await Promise.allSettled([withdrawApplication(row.userID, row.id), handleApplication(otherID, row.id, { ...base(closed.revision), action: 'REOPEN', privateNote: 'Concurrent reopening fixture' })])
    expect(race[0]!.status).toBe('fulfilled')
    expect((await sql`select status,handling_stage from applications where id=${row.id}`)[0]).toEqual({ status: 'WITHDRAWN', handling_stage: 'CLOSED' })
    const rejected = await contacted()
    const end = await handleApplication(operatorID, rejected.id, { ...base(rejected.revision), action: 'CLOSE', reason: 'COMPLETED' })
    await sql`update applications set status='REJECTED' where id=${rejected.id}`
    await expect(handleApplication(otherID, rejected.id, { ...base(end.revision), action: 'REOPEN', privateNote: 'Cannot undo employer rejection' })).rejects.toMatchObject({ statusCode: 409 })
  })

  it('never treats a correction as renewed permission after candidate-requested closure, even outside latest50 history', async () => {
    const row = await contacted()
    for (let n = 0; n < 52; n++) await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'FOLLOW_UP' })
    const closed = await handleApplication(operatorID, row.id, { ...base(row.revision++), action: 'CLOSE', reason: 'CANDIDATE_REQUEST' })
    await handleApplication(otherID, row.id, { ...base(row.revision++), action: 'CORRECT', targetRevision: closed.revision, reason: 'RECORDED_IN_ERROR', privateNote: 'An operator claim is not renewed candidate permission' })
    for (let targetRevision = 5; targetRevision <= 56; targetRevision++) await handleApplication(otherID, row.id, { ...base(row.revision++), action: 'CORRECT', targetRevision, reason: 'DETAILS_INACCURATE', privateNote: 'Fictional old-note correction' })
    const detail = await getAdminApplication(row.id)
    expect(detail.events.some(event => event.kind === 'CLOSED')).toBe(false)
    expect(detail.canReopenHandling).toBe(false)
    await expect(handleApplication(otherID, row.id, { ...base(row.revision), action: 'REOPEN', privateNote: 'No new permission was provided' })).rejects.toMatchObject({ statusCode: 409 })
    // Direct stage drift cannot bypass the separate package consent boundary either.
    await sql`update applications set handling_stage='CONTACTED' where id=${row.id}`
    await expect(prepareApplicationPackage(operatorID, row.id)).rejects.toMatchObject({ statusCode: 409 })
  })
})
