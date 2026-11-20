import { z } from 'zod'
import { editorTargetSchema } from '#server/services/vacancies/editor-target'
import { importVacancies, vacancyImportItemSchema } from '#server/services/vacancies/import-vacancies'
import { requireAdminSession } from '#server/utils/admin-session'
import { readBoundedJson } from '#server/utils/bounded-json'
import { requireSameOrigin } from '#server/utils/same-origin'
import { setRequestOperation } from '#server/utils/observability'

const request = z.strictObject({ target: editorTargetSchema, item: vacancyImportItemSchema })

export default defineEventHandler(async (event) => {
  const admin = await requireAdminSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const parsed = request.safeParse(await readBoundedJson(event, 384 * 1024))
  if (!parsed.success) throw createError({
    statusCode: 422, statusMessage: 'Check the vacancy fields',
    data: { issues: parsed.error.issues.slice(0, 40).map(issue => ({
      field: (issue.path[0] === 'item' ? issue.path.slice(1) : issue.path).join('.'), message: issue.message,
    })) },
  })
  const { target, item } = parsed.data
  setRequestOperation(event, target.mode === 'create' ? 'vacancy.editor.create' : 'vacancy.editor.edit')
  const [result] = await importVacancies([item], { actorUserID: admin.id, editorTarget: target })
  return result!
})
