import { z } from 'zod'
import { requireAdminSession } from '#server/utils/admin-session'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'
import { parseVacancyCsv } from '#server/services/vacancies/parse-vacancy-csv'
import { previewVacancyImport } from '#server/services/vacancies/import-preview'
import { importVacancies } from '#server/services/vacancies/import-vacancies'
import { vacancyCsvByteLimit } from '#shared/types/vacancy-import'
import type { VacancyImportPreview } from '#shared/types/vacancy-import'

const requestSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('preview'), csv: z.string().max(vacancyCsvByteLimit) }),
  z.object({ mode: z.literal('import'), csv: z.string().max(vacancyCsvByteLimit), revision: z.string().regex(/^[a-f0-9]{64}$/) }),
])

export default defineEventHandler(async (event) => {
  const admin = await requireAdminSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  // JSON escaping can expand the file; the parser separately caps decoded UTF-8 bytes.
  const parsedBody = requestSchema.safeParse(await readBoundedJson(event, vacancyCsvByteLimit * 6 + 1024))
  if (!parsedBody.success) throw createError({ statusCode: 400, statusMessage: 'Invalid file import request' })
  const body = parsedBody.data
  const parsed = parseVacancyCsv(body.csv)
  if (parsed.issues.length) {
    const preview: VacancyImportPreview = {
      valid: false, rowCount: parsed.rowCount, issues: parsed.issues, revision: null, rows: [],
      summary: { created: 0, updated: 0, unchanged: 0, withdrawnPublished: 0 },
    }
    if (body.mode === 'import') setResponseStatus(event, 422)
    return { preview, result: null }
  }
  const items = parsed.items.map(row => row.item)
  if (body.mode === 'preview') return { preview: await previewVacancyImport(items), result: null }
  const result = await importVacancies(items, { expectedRevision: body.revision, actorUserID: admin.id })
  return { preview: null, result: { items: result, total: result.length } }
})
