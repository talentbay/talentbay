import {
  applicationInputSchema,
  createApplication,
} from '#server/services/candidates/applications'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const vacancyID = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(vacancyID) || vacancyID <= 0 || vacancyID > 2147483647) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vacancy id',
    })
  }

  const result = applicationInputSchema.safeParse(await readBoundedJson(event, 24_000))
  if (!result.success) throw createError({ statusCode: 400, statusMessage: 'Review the application notice and confirm the submission' })
  return await createApplication(session.user.id, vacancyID, result.data)
})
