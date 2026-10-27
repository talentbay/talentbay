import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { listVacancies } from '#server/repositories/vacancies'
import type { VacancySearch } from '#server/services/vacancies/search-query'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const token = `Pagination${randomUUID().replaceAll('-', '')}`
const source = `Fictional ${token}`
const base = { q: token, limit: 50, sort: 'newest' as const }
let companyID: number
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Pagination error'), details))
beforeAll(async () => {
  const [company] = await sql`insert into organisations (name,slug,status) values (${source},${token.toLowerCase()},'ACTIVE') returning id`
  companyID = company!.id
  await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code,published_at,source_name,salary_min,salary_max,salary_currency,salary_period)
    select ${companyID},${token.toLowerCase()}||'-'||n,${token}||' Fictional Engineer '||n,'Fictional pagination-only job, not an approved real employer.',
      case when n>111 then 'DRAFT'::vacancy_status else 'PUBLISHED'::vacancy_status end,
      case when n>114 then 'UNREVIEWED'::vacancy_review_status else 'VERIFIED'::vacancy_review_status end,
      'FULL_TIME','REMOTE',case when n%2=0 then 'GB' else 'DE' end,
      case when n>109 then null else '2026-10-27T12:00:00.123000Z'::timestamptz+(n%3)*interval '1 microsecond' end,
      ${source},50000,70000+(n%4),case when n%3=0 then 'USD' else 'EUR' end,
      case when n%5=0 then 'MONTH'::salary_period else 'YEAR'::salary_period end
    from generate_series(1,117) n`
})
afterAll(async () => {
  await closeDatabase()
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql.end(); vi.unstubAllGlobals()
})
async function collect(query: VacancySearch) {
  const items: Awaited<ReturnType<typeof listVacancies>>['items'] = []
  let before: string | undefined
  for (let page = 0; page < 15; page++) {
    const result = await listVacancies({ ...query, before })
    items.push(...result.items)
    if (!result.nextCursor) return items
    before = result.nextCursor
  }
  throw new Error('Pagination did not terminate within its fixture bound')
}
describe('public vacancy keyset pages', () => {
  it('returns every visible ID exactly once across ties, microseconds and legacy NULL dates', async () => {
    const items = await collect(base)
    const expected = await sql`select id from vacancies where organisation_id=${companyID} and status='PUBLISHED' and review_status='VERIFIED' order by published_at desc nulls last,id desc`
    expect(items.map(item => item.id)).toEqual(expected.map(row => row.id))
    expect(items).toHaveLength(111)
    expect(new Set(items.map(item => item.id)).size).toBe(111)
    expect(items.slice(-2).every(item => item.publishedAt === null)).toBe(true)
  })
  it('binds cursors to filters and bounds; country/workplace/visibility apply on every page', async () => {
    const first = await listVacancies(base)
    await expect(listVacancies({ ...base, q: 'different', before: first.nextCursor! })).rejects.toMatchObject({ statusCode: 400 })
    await expect(listVacancies({ ...base, before: 'x'.repeat(513) })).rejects.toMatchObject({ statusCode: 400 })
    await expect(listVacancies({ ...base, limit: -1 })).rejects.toMatchObject({ statusCode: 400 })
    const filtered = await collect({ ...base, limit: 10, countryCode: 'gb', workplaceType: 'REMOTE' })
    expect(filtered).toHaveLength(55)
    expect(filtered.every(item => item.location.countryCode === 'GB' && item.workplaceType === 'REMOTE')).toBe(true)
    expect((await listVacancies({ ...base, workplaceType: 'ONSITE' })).items).toEqual([])
  })
  it('does not invent comparability across salary currencies or periods', async () => {
    await expect(listVacancies({ ...base, sort: 'salary-desc' })).rejects.toMatchObject({ statusCode: 400 })
    const query = { ...base, limit: 10, sort: 'salary-desc' as const, salaryCurrency: 'EUR', salaryPeriod: 'YEAR' as const }
    const items = await collect(query)
    const expected = await sql`select id from vacancies where organisation_id=${companyID} and status='PUBLISHED' and salary_currency='EUR' and salary_period='YEAR' order by salary_max desc,published_at desc nulls last,id desc`
    expect(items.map(item => item.id)).toEqual(expected.map(row => row.id))
    expect(items.every(item => item.salary?.currency === 'EUR' && item.salary.period === 'YEAR')).toBe(true)
  })
  it('inspects a real bounded query plan without asserting a synthetic index win', async () => {
    const result = await sql`explain (analyze,buffers,format json) select v.*,o.name from vacancies v join organisations o on o.id=v.organisation_id
      where v.organisation_id=${companyID} and v.status='PUBLISHED' and v.review_status='VERIFIED' and o.status='ACTIVE'
      order by v.published_at desc nulls last,v.id desc limit 51`
    const report = result[0]!['QUERY PLAN'][0]
    expect(report.Plan['Node Type']).toBe('Limit')
    expect(report.Plan['Actual Rows']).toBe(51)
    const nodes: string[] = []
    type PlanNode = { 'Node Type': string; Plans?: PlanNode[] }
    function visit(node: PlanNode) { nodes.push(node['Node Type']); node.Plans?.forEach(visit) }
    visit(report.Plan)
    console.info('Fictional 111-record pagination plan', { nodes, executionMs: report['Execution Time'] })
  })
  it('uses the saved timestamp/ID boundary even if that row is archived concurrently', async () => {
    const first = await listVacancies(base)
    const last = first.items.at(-1)!
    await sql`update vacancies set status='ARCHIVED' where id=${last.id}`
    const next = await listVacancies({ ...base, before: first.nextCursor! })
    expect(next.total).toBe(110)
    expect(next.items.some(item => first.items.some(previous => previous.id === item.id))).toBe(false)
    expect(next.items.length).toBe(50)
    await sql`update organisations set status='ARCHIVED' where id=${companyID}`
    expect((await listVacancies({ ...base, before: next.nextCursor! })).items).toEqual([])
    await sql`update organisations set status='ACTIVE' where id=${companyID}`
  })
})
