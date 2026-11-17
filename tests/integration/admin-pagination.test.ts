import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { listAdminUsers } from '#server/services/admin/users'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const token = `AdminPage${randomUUID().replaceAll('-', '')}`
let companyID: number
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Admin page operation failed'), details))
beforeAll(async () => {
  await sql`insert into users (name,email,role,created_at) select ${token}||' Fictional User '||n,${token.toLowerCase()}||'-'||n||'@talentbay.invalid',
    case when n%10=0 then 'ADMIN'::user_role else 'USER'::user_role end,
    '2026-10-27T00:00:00.123000Z'::timestamptz+(n%3)*interval '1 microsecond' from generate_series(1,111) n`
  const [company] = await sql`insert into organisations (name,slug) values (${token}||' Fictional Company',${token.toLowerCase()}) returning id`
  companyID = company!.id
  await sql`insert into vacancies (organisation_id,slug,title,description,employment_type,workplace_type,country_code,source_name,updated_at)
    select ${companyID},${token.toLowerCase()}||'-'||n,${token}||' Fictional Role '||n,'Fictional isolated admin queue fixture, not public content.',
      'FULL_TIME','REMOTE','GB',${token},'2026-10-27T00:00:00.123000Z'::timestamptz+(n%3)*interval '1 microsecond' from generate_series(1,111) n`
})
afterAll(async () => {
  await closeDatabase()
  if (companyID) { await sql`delete from vacancies where organisation_id=${companyID}`; await sql`delete from organisations where id=${companyID}` }
  await sql`delete from users where email like ${token.toLowerCase()+'-%@talentbay.invalid'}`
  await sql.end(); vi.unstubAllGlobals()
})

describe('bounded complete admin registries', () => {
  it('reads every matching user after100 without duplicate timestamp ties or profile overfetch', async () => {
    const ids: number[] = []; let before: string | undefined
    for (let page = 0; page < 10; page++) {
      const result = await listAdminUsers({ q: token, before })
      expect(result.total).toBe(111)
      expect(result.items.length).toBeLessThanOrEqual(25)
      for (const row of result.items) expect(Object.keys(row).sort()).toEqual(['id', 'name', 'email', 'role', 'avatarUrl', 'createdAt', 'lastLoginAt'].sort())
      ids.push(...result.items.map(row => row.id))
      if (!result.nextCursor) break
      before = result.nextCursor
    }
    const expected = await sql`select id from users where name like ${token+'%'} order by created_at desc,id desc`
    expect(ids).toEqual(expected.map(row => row.id)); expect(ids).toHaveLength(111)
    const admins = await listAdminUsers({ q: token, role: 'ADMIN' })
    expect(admins.total).toBe(11)
    expect(admins.items.every(row => row.role === 'ADMIN')).toBe(true)
  })
  it('walks the entire review queue, applies search/state filters and scopes its cursors', async () => {
    const ids: number[] = []; let before: string | undefined
    const firstUsers = await listAdminUsers({ q: token })
    await expect(listAdminVacancies({ q: token, before: firstUsers.nextCursor! })).rejects.toMatchObject({ statusCode: 400 })
    for (let page = 0; page < 10; page++) {
      const result = await listAdminVacancies({ q: token, status: 'DRAFT', reviewStatus: 'UNREVIEWED', before })
      expect(result.total).toBe(111)
      ids.push(...result.items.map(row => row.id))
      if (!result.nextCursor) break
      before = result.nextCursor
    }
    const expected = await sql`select id from vacancies where organisation_id=${companyID} order by updated_at desc,id desc`
    expect(ids).toEqual(expected.map(row => row.id)); expect(ids).toHaveLength(111)
    expect((await listAdminVacancies({ q: token, reviewStatus: 'FLAGGED' })).total).toBe(0)
    const first = await listAdminVacancies({ q: token })
    await expect(listAdminVacancies({ q: token, reviewStatus: 'VERIFIED', before: first.nextCursor! })).rejects.toMatchObject({ statusCode: 400 })
    await sql`update vacancies set review_status='FLAGGED',updated_at=now() where id=${ids.at(-1)!}`
    expect((await listAdminVacancies({ q: token })).items[0]!.id).toBe(ids.at(-1))
    expect((await listAdminVacancies({ q: token, reviewStatus: 'FLAGGED' })).total).toBe(1)
  })
  it('rejects malformed or changed page bounds and does not interpret search text as LIKE wildcards', async () => {
    for (const input of [{ limit: 51 }, { limit: 0 }, { before: 'bad' }, { before: 'x'.repeat(513) }, { q: 'x'.repeat(121) }]) {
      await expect(listAdminUsers(input)).rejects.toMatchObject({ statusCode: 400 })
      await expect(listAdminVacancies(input)).rejects.toMatchObject({ statusCode: 400 })
    }
    expect((await listAdminUsers({ q: token+'%' })).items).toEqual([])
    expect((await listAdminVacancies({ q: token+'_' })).items).toEqual([])
  })
})
