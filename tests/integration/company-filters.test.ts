import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { listPublicCompanyOptions } from '#server/repositories/company-options'
import { listVacancies } from '#server/repositories/vacancies'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const key = 'cf-' + randomUUID()
const name = 'Fixture ' + key
vi.stubGlobal('createError', (details: object) => Object.assign(new Error(), details))
beforeAll(async () => {
  await sql`insert into organisations(name,slug,status)
    select ${name}||case when n <= 2 then ' Labs' else ' Labs '||n end, ${key}||'-'||n,
      case when n=3 then 'ARCHIVED'::organisation_status else 'ACTIVE'::organisation_status end
    from generate_series(1,32) n`
  await sql`insert into vacancies(organisation_id,slug,title,description,country_code,employment_type,workplace_type,status,review_status)
    select o.id,o.slug||'-role-'||n,'Engineer','Fictional fixture.',case when n=2 then 'DE' else 'GB' end,'FULL_TIME','REMOTE',
      case when n=3 or o.slug=${key+'-4'} then 'DRAFT'::vacancy_status else 'PUBLISHED'::vacancy_status end,
      case when o.slug=${key+'-5'} then 'FLAGGED'::vacancy_review_status else 'VERIFIED'::vacancy_review_status end
    from organisations o cross join generate_series(1,3) n where o.slug like ${key+'-%'} and o.slug<>${key+'-6'}`
})
afterAll(async () => {
  await sql`delete from vacancies where organisation_id in (select id from organisations where slug like ${key+'-%'})`
  await sql`delete from organisations where slug like ${key+'-%'}`
  await sql.end(); await closeDatabase(); vi.unstubAllGlobals()
})
describe('exact company scope', () => {
  it('only suggests distinct companies with publicly visible jobs, bounded and searchable beyond the first page', async () => {
    const options = await listPublicCompanyOptions(key)
    expect(options).toHaveLength(25)
    expect(options.slice(0, 2)).toEqual([1, 2].map(n => ({ name: name+' Labs', slug: key+'-'+n })))
    for (const n of [3, 4, 5, 6]) expect(await listPublicCompanyOptions(name+' Labs '+n)).not.toContainEqual({ name: name+' Labs '+n, slug: key+'-'+n })
    expect(await listPublicCompanyOptions(name+' Labs 9')).toEqual([{ name: name+' Labs 9', slug: key+'-9' }])
    expect(await listPublicCompanyOptions(key+'%')).toEqual([])
  })
  it('separates identically named companies, intersects location and pins each page to the same employer', async () => {
    const company = key+'-1'
    const first = await listVacancies({ company, limit: 1 })
    const next = await listVacancies({ company, limit: 1, before: first.nextCursor! })
    expect(first.total).toBe(2); expect(next.total).toBe(2); expect(next.nextCursor).toBeNull()
    expect(first.items[0]!.id).not.toBe(next.items[0]!.id)
    expect([...first.items, ...next.items].every(v => v.company.slug === company)).toBe(true)
    expect((await listVacancies({ company, countryCode: 'DE' })).total).toBe(1)
    await expect(listVacancies({ company: key+'-2', limit: 1, before: first.nextCursor! })).rejects.toMatchObject({ statusCode: 400 })
    expect((await listVacancies({ company: key+'-4' })).total).toBe(0)
    const queue = await listAdminVacancies({ company, limit: 1 })
    expect(queue.total).toBe(3); expect(queue.items[0]!.companySlug).toBe(company)
    await expect(listAdminVacancies({ company: key+'-2', limit: 1, before: queue.nextCursor! })).rejects.toMatchObject({ statusCode: 400 })
    expect((await listAdminVacancies({ company: key+'-4', publicOnly: 'true' })).total).toBe(0)
    expect((await listAdminVacancies({ company: key+'-4', status: 'DRAFT' })).total).toBe(3)
  })
})
