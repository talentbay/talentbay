import { afterAll, describe, expect, it, vi } from 'vitest'
import { adminUsersQuery, containsText, readAdminCursor, writeAdminCursor } from '#server/services/admin/list-page'
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Invalid admin page'), details))
afterAll(() => vi.unstubAllGlobals())

describe('admin list cursor boundary', () => {
  it('keeps exact microseconds, binds scope/filters and excludes private search text from the cursor', () => {
    const query = adminUsersQuery.parse({ q: 'fictional@talentbay.invalid', role: 'USER' })
    const row = { id: 123, date: '2026-10-27T00:00:00.123456Z' }
    const cursor = writeAdminCursor('users', query, row)
    expect(readAdminCursor('users', { ...query, before: cursor })).toMatchObject(row)
    expect(Buffer.from(cursor, 'base64url').toString()).not.toContain('fictional@')
    expect(() => readAdminCursor('vacancies', { ...query, before: cursor })).toThrow()
    expect(() => readAdminCursor('users', { ...query, limit: 10, before: cursor })).toThrow()
    expect(() => readAdminCursor('users', { ...query, before: 'bad' })).toThrow()
  })
  it('escapes LIKE patterns as literal search text', () => {
    expect(containsText('a%_\\b')).toBe('%a\\%\\_\\\\b%')
  })
})
