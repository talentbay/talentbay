import {
  applicationInputSchema,
  createApplication,
} from '#server/services/candidates/applications'
import { requireSameOrigin } from '#server/utils/same-origin'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const vacancyID = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(vacancyID) || vacancyID <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vacancy id',
    })
  }

  const body = await readValidatedBody(event, value => applicationInputSchema.parse(value))
  return await createApplication(session.user.id, vacancyID, body.coverLetter)
})
