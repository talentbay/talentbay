import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { listVacancies } from '#server/repositories/vacancies'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'
import { listAdminApplications } from '#server/services/admin/applications'
import { getAdminDashboard } from '#server/services/admin/dashboard'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const marker = `Volume${randomUUID().replaceAll('-', '')}`
let companyID: number
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Synthetic volume request rejected'), details))
beforeAll(async () => {
  const [company] = await sql`insert into organisations (name,slug,status) values (${marker},${marker.toLowerCase()},'ACTIVE') returning id`
  companyID = company!.id
  await sql`insert into vacancies (organisation_id,slug,title,description,employment_type,workplace_type,country_code,status,review_status,salary_min,salary_max,salary_currency,salary_period,source_name)
    select ${companyID},${marker.toLowerCase()}||'-'||n,${marker}||' Synthetic Role '||n,'Fictional isolated representative-volume fixture; not public content.',
      'FULL_TIME','REMOTE','GB',case when n%5=0 then 'DRAFT'::vacancy_status else 'PUBLISHED'::vacancy_status end,
      case when n%7=0 then 'FLAGGED'::vacancy_review_status else 'VERIFIED'::vacancy_review_status end,
      50000+n,70000+n,'GBP','YEAR',${marker} from generate_series(1,5000) n`
  await sql`insert into users (name,email) select ${marker}||' Synthetic Candidate '||n,${marker.toLowerCase()}||'-'||n||'@talentbay.invalid' from generate_series(1,1000) n`
  const [vacancy] = await sql`select id from vacancies where organisation_id=${companyID} order by id limit 1`
  await sql`insert into applications (user_id,vacancy_id) select id,${vacancy!.id} from users where name like ${marker+'%'}`
  await sql`insert into application_handling_events (application_id,revision,kind,stage,actor_user_id)
    select id,1,'RECEIVED','RECEIVED',user_id from applications where vacancy_id=${vacancy!.id}`
  await sql`update applications set handling_revision=1 where vacancy_id=${vacancy!.id}`
  await sql`analyze vacancies`; await sql`analyze applications`; await sql`analyze application_handling_events`
})
afterAll(async () => {
  await closeDatabase()
  await sql`delete from users where name like ${marker+'%'}`
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql.end(); vi.unstubAllGlobals()
})

describe('bounded representative synthetic volume (not a production load certificate)', () => {
  it('keeps public/admin counts and pages bounded with5000 roles and1000 applications', async () => {
    const started = performance.now()
    const expected = await sql`select id from vacancies where organisation_id=${companyID} and status='PUBLISHED' and review_status='VERIFIED' order by id desc`
    const ids: number[] = []; let cursor: string | undefined
    for (let page = 0; page < 101; page++) {
      const result = await listVacancies({ q: marker, limit: 50, before: cursor })
      expect(result.total).toBe(expected.length)
      expect(result.items.length).toBeLessThanOrEqual(50)
      expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(128 * 1024)
      ids.push(...result.items.map(item => item.id))
      if (!result.nextCursor) break
      cursor = result.nextCursor
    }
    expect(ids).toEqual(expected.map(row => row.id))
    const review = await listAdminVacancies({ q: marker })
    expect(review.total).toBe(5000); expect(review.items).toHaveLength(25)
    const queue = await listAdminApplications({})
    expect(queue.total).toBe(1000); expect(queue.items).toHaveLength(25)
    expect(JSON.stringify(queue)).not.toContain('coverLetter')
    const dashboard = await getAdminDashboard()
    expect(dashboard.applications).toBe(1000); expect(dashboard.oldest).toHaveLength(5)
    console.info(JSON.stringify({ check: 'synthetic representative volume', vacancies: 5000, applications: 1000, publicRows: ids.length, fullCursorWalkAndQueuesMs: Math.round(performance.now()-started), localOnly: true, productionSLA: false }))
  })
  it('retains unique/FK/time/search indexes and obtains an actual selective full-text plan', async () => {
    const rows = await sql`select indexname from pg_indexes where schemaname='public'`
    const indexes = rows.map(row => row.indexname)
    for (const name of ['vacancies_search_idx', 'vacancies_source_external_id_idx', 'applications_user_vacancy_idx', 'application_events_revision_idx', 'application_events_command_idx', 'applications_created_queue_idx', 'application_events_recorded_idx']) expect(indexes).toContain(name)
    const plan = await sql`explain (analyze,format json) select id from vacancies where to_tsvector('english',title||' '||coalesce(summary,'')||' '||description) @@ websearch_to_tsquery('english','nonexistentselectivefixture')`
    const report = plan[0]!['QUERY PLAN'][0]
    // Planner choice on this machine is evidence, not an invariant forced with enable_seqscan.
    expect(report.Plan['Actual Rows']).toBe(0)
    console.info(JSON.stringify({ check: 'synthetic selective search plan', planningMs: report['Planning Time'], executionMs: report['Execution Time'], indexObserved: JSON.stringify(report.Plan).includes('vacancies_search_idx'), productionSLA: false }))
  })
})
