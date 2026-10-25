import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, describe, expect, it } from 'vitest'
import { promoteAdmin } from '../../scripts/promote-admin.mjs'

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const name = `Bootstrap fixture ${randomUUID()}`
afterAll(async () => { await sql`delete from users where name = ${name}`; await sql.end() })

describe('permanent-user admin bootstrap', () => {
  it('supports a Telegram-only account by exact local ID, with dry run and idempotent apply', async () => {
    const [user] = await sql`insert into users (name, email) values (${name}, null) returning id`
    const options = { userId: user!.id, connectionString: process.env.DATABASE_URL }
    expect(await promoteAdmin({ ...options, apply: false })).toMatchObject({ outcome: 'pending', userId: user!.id, email: null, previousRole: 'USER' })
    expect((await sql`select role from users where id = ${user!.id}`)[0]?.role).toBe('USER')
    expect(await promoteAdmin({ ...options, apply: true })).toMatchObject({ outcome: 'updated', nextRole: 'ADMIN' })
    expect(await promoteAdmin({ ...options, apply: true })).toMatchObject({ outcome: 'unchanged', previousRole: 'ADMIN' })
  })
  it('does not create a missing account or resolve an ambiguous selector', async () => {
    await expect(promoteAdmin({ userId: 2_147_483_647, apply: true, connectionString: process.env.DATABASE_URL })).rejects.toThrow('User not found')
    await expect(promoteAdmin({ userId: 1, email: 'someone@example.com', apply: true, connectionString: process.env.DATABASE_URL })).rejects.toThrow('exactly one')
  })
})
