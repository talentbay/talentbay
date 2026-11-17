import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { getAdminDashboard } from '#server/services/admin/dashboard'
import { listAdminApplications } from '#server/services/admin/applications'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import type { ApplicationSnapshot } from '#shared/types/application-handling'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const slug = `ops-${randomUUID()}`
const users: number[] = [], applications: number[] = []
let companyID: number, vacancyID: number, operatorID: number, revokedID: number
beforeAll(async () => {
  vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Operations fixture error'), details))
  const actors = await sql`insert into users (name,role) values ('Metrics operator','ADMIN'),('Former metrics operator','USER') returning id`
  operatorID = actors[0]!.id; revokedID = actors[1]!.id; users.push(operatorID, revokedID)
  const [company] = await sql`insert into organisations (name,slug,status) values ('Fictional metrics company',${slug},'ACTIVE') returning id`
  companyID = company!.id
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code)
    values (${companyID},${slug},'Fictional operations engineer','Not a real role','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB') returning id`
  vacancyID = vacancy!.id
  for (let n = 0; n < 32; n++) {
    const [user] = await sql`insert into users (name,email) values ('PRIVATE_METRICS_NAME',${slug+'-'+n+'@talentbay.invalid'}) returning id`
    users.push(user!.id)
    const [app] = await sql`insert into applications (user_id,vacancy_id,created_at,handling_stage,assigned_user_id,status)
      values (${user!.id},${vacancyID},now()-${n < 2 ? 45 : 2}*interval '1 day',
      ${n < 28 ? 'RECEIVED' : n === 28 ? 'CONTACTED' : n === 29 ? 'FOLLOW_UP' : 'CLOSED'}::application_handling_stage,
      ${n === 0 ? revokedID : n % 2 ? operatorID : null},${n === 31 ? 'WITHDRAWN' : 'NEW'}::application_status) returning id`
    applications.push(app!.id)
  }
  await sql`insert into candidate_profiles (user_id) values (${users[2]!})`
  const snapshot: ApplicationSnapshot = {
    version: 1, submittedAt: new Date().toISOString(), disclosureVersion: applicationDisclosureVersion,
    candidate: { name: 'PRIVATE_METRICS_NAME', email: null, profile: { headline: null, about: null, countryCode: null, city: null, phone: null, telegram: '@fictional_metric', githubUrl: null, linkedinUrl: null } },
    recipient: { organisationID: companyID, name: 'Fictional metrics company' },
    vacancy: { id: vacancyID, slug, title: 'Fictional operations engineer', city: null, countryCode: 'GB', sourceUrl: null, sourceExternalID: null },
  }
  for (const index of [4, 6, 7]) await sql`update applications set submission_snapshot=${sql.json(snapshot)} where id=${applications[index]!}`
  for (const [index, offset] of [[4, '1 hour'], [6, '-1 hour'], [7, '100 days']] as const) {
    await sql`insert into application_handling_events (application_id,revision,kind,stage,created_at)
      select id,1,'STARTED','IN_PROGRESS',created_at+${offset}::interval from applications where id=${applications[index]!}`
  }
  for (const [id, kinds] of [[applications[28]!, ['CONTACTED', 'CONTACTED', 'SHARED']], [applications[29]!, ['CONTACTED', 'SHARED', 'CORRECTED']]] as const) {
    for (const [index, kind] of kinds.entries()) await sql`insert into application_handling_events (application_id,revision,kind,stage,data,private_note,created_at)
      values (${id},${index + 1},${kind}::application_handling_event_kind,'CONTACTED',${sql.json(kind === 'CORRECTED' ? { correctedRevision: 2 } : { reference: 'PRIVATE_METRIC_REFERENCE' })},'PRIVATE_METRIC_NOTE',now()-interval '1 day')`
  }
  // A legacy start must not invent a snapshot-backed first-start sample.
  await sql`insert into application_handling_events (application_id,revision,kind,stage,created_at) values (${applications[0]!},1,'STARTED','IN_PROGRESS',now()-interval '1 day')`
})
afterAll(async () => {
  await closeDatabase()
  if (users.length) await sql`delete from users where id in ${sql(users)}`
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql.end(); vi.unstubAllGlobals()
})

describe('source-backed operator overview', () => {
  it('counts the full current snapshot and projects no candidate/profile/private event fields', async () => {
    const data = await getAdminDashboard({ days: '7' }, operatorID)
    const [all] = await sql`select count(*)::int as applications from applications`
    expect(data.applications).toBe(all!.applications)
    expect(data.handlingStages.reduce((sum, row) => sum + row.count, 0)).toBe(data.applications)
    expect(data.applicationStatuses.reduce((sum, row) => sum + row.count, 0)).toBe(data.applications)
    const [work] = await sql`select count(*) filter(where handling_stage='RECEIVED')::int as awaiting,
      count(*) filter(where handling_stage<>'RECEIVED')::int as progress,
      count(*) filter(where not exists(select 1 from users where id=a.assigned_user_id and role='ADMIN'))::int as owner,
      count(*) filter(where assigned_user_id=${operatorID})::int as mine
      from applications a where status not in ('WITHDRAWN','REJECTED') and handling_stage<>'CLOSED'`
    expect(data.work).toEqual({ awaitingStart: work!.awaiting, inProgress: work!.progress, needsOwner: work!.owner, mine: work!.mine })
    expect(data.oldest).toHaveLength(Math.min(5, data.work.awaitingStart))
    expect(data.oldest.every(row => row.ageSeconds >= 0)).toBe(true)
    expect(Object.keys(data.oldest[0]!).sort()).toEqual(['ageSeconds', 'companyName', 'id', 'receivedAt', 'title'])
    for (const privateValue of ['PRIVATE_METRICS_NAME', 'PRIVATE_METRIC_REFERENCE', 'PRIVATE_METRIC_NOTE', '@talentbay.invalid']) expect(JSON.stringify(data)).not.toContain(privateValue)
    expect(Date.parse(data.window.before) - Date.parse(data.window.from)).toBe(7 * 86400000)
    expect(data.firstStart).toEqual({ samples: 1, averageSeconds: 3600 })
  })
  it('drills down into exactly the same work/event/period sets and retains total beyond the first25', async () => {
    const data = await getAdminDashboard({ days: '7' }, operatorID)
    for (const [filters, expected] of [
      [{ work: 'active', stage: 'RECEIVED' }, data.work.awaitingStart], [{ work: 'in-progress' }, data.work.inProgress],
      [{ work: 'needs-owner' }, data.work.needsOwner], [{ work: 'active', assignee: 'mine' }, data.work.mine],
      [{ receivedFrom: data.window.from, receivedBefore: data.window.before }, data.activity.received],
      [{ recorded: 'CONTACTED', recordedFrom: data.window.from, recordedBefore: data.window.before }, data.activity.contactRecorded],
      [{ recorded: 'SHARED', recordedFrom: data.window.from, recordedBefore: data.window.before }, data.activity.handoffRecorded],
    ] as const) expect((await listAdminApplications(filters, operatorID)).total).toBe(expected)
    const first = await listAdminApplications({ work: 'active', stage: 'RECEIVED' }, operatorID)
    expect(first.items).toHaveLength(25); expect(first.nextCursor).not.toBeNull()
    const rest = await listAdminApplications({ work: 'active', stage: 'RECEIVED', before: first.nextCursor! }, operatorID)
    expect(rest.total).toBe(first.total)
    expect(new Set([...first.items, ...rest.items].map(row => row.id)).size).toBe(first.total)
    expect((await listAdminApplications({ work: 'needs-owner' })).items.some(row => row.id === applications[0])).toBe(true)
    const eventRows = await listAdminApplications({ recorded: 'SHARED', recordedFrom: data.window.from, recordedBefore: data.window.before })
    expect(eventRows.items.map(row => row.id)).toContain(applications[28])
    expect(eventRows.items.map(row => row.id)).not.toContain(applications[29])
    const contacts = await listAdminApplications({ recorded: 'CONTACTED', recordedFrom: data.window.from, recordedBefore: data.window.before })
    expect(contacts.items.filter(row => row.id === applications[28])).toHaveLength(1)
  })
  it('uses half-open received bounds and public visibility, not publication state alone', async () => {
    const data = await getAdminDashboard({ days: '7' }, operatorID)
    await sql`update applications set created_at=${data.window.from} where id=${applications[2]!}`
    await sql`update applications set created_at=${data.window.before} where id=${applications[3]!}`
    const rows = await listAdminApplications({ receivedFrom: data.window.from, receivedBefore: data.window.before })
    const ids = [...rows.items.map(row => row.id)]
    if (rows.nextCursor) ids.push(...(await listAdminApplications({ receivedFrom: data.window.from, receivedBefore: data.window.before, before: rows.nextCursor })).items.map(row => row.id))
    expect(ids).toContain(applications[2]); expect(ids).not.toContain(applications[3])
    await sql`update organisations set status='DRAFT' where id=${companyID}`
    try {
      expect((await listAdminVacancies({ q: 'Fictional operations engineer', status: 'PUBLISHED' })).total).toBe(1)
      expect((await listAdminVacancies({ q: 'Fictional operations engineer', publicOnly: 'true' })).total).toBe(0)
      const [visible] = await sql`select count(*)::int as total from vacancies v join organisations o on o.id=v.organisation_id where v.status='PUBLISHED' and v.review_status='VERIFIED' and o.status='ACTIVE'`
      expect((await getAdminDashboard()).vacancies.published).toBe(visible!.total)
    } finally { await sql`update organisations set status='ACTIVE' where id=${companyID}` }
    await expect(getAdminDashboard({ days: '100' as '7' })).rejects.toMatchObject({ statusCode: 400 })
  })
})
