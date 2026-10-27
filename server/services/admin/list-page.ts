import { createHash } from 'node:crypto'
import { z } from 'zod'

const base = { q: z.string().trim().max(120).default(''), limit: z.number().int().min(1).max(50).default(25), before: z.string().min(1).max(512).regex(/^[A-Za-z0-9_-]+$/).optional() }
export const adminUsersQuery = z.object({ ...base, role: z.enum(['USER', 'ADMIN']).optional() }).strict()
export const adminVacanciesQuery = z.object({ ...base, status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(), reviewStatus: z.enum(['UNREVIEWED', 'VERIFIED', 'FLAGGED']).optional() }).strict()
const cursorSchema = z.object({ id: z.number().int().positive().max(2147483647), date: z.iso.datetime({ offset: true }), v: z.literal(1), filters: z.string().regex(/^[a-f0-9]{64}$/) }).strict()
export type AdminCursor = z.infer<typeof cursorSchema>
type PageQuery = { before?: string; limit: number }
function fingerprint(scope: string, query: PageQuery) {
  const { before: _before, ...filters } = query
  return createHash('sha256').update(JSON.stringify([scope, filters])).digest('hex')
}
export function readAdminCursor(scope: string, query: PageQuery): AdminCursor | null {
  if (!query.before) return null
  try {
    const bytes = Buffer.from(query.before, 'base64url')
    if (bytes.toString('base64url') !== query.before) throw new Error('encoding')
    const cursor = cursorSchema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)))
    if (cursor.filters !== fingerprint(scope, query)) throw new Error('filters')
    return cursor
  } catch { throw createError({ statusCode: 400, statusMessage: 'Invalid or changed admin cursor. Restart this list.' }) }
}
export function writeAdminCursor(scope: string, query: PageQuery, row: { id: number; date: string }) {
  return Buffer.from(JSON.stringify({ ...row, v: 1, filters: fingerprint(scope, query) })).toString('base64url')
}
export const containsText = (text: string) => `%${text.replace(/[\\%_]/g, '\\$&')}%`
