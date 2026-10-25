import { requireAdminSession } from '#server/utils/admin-session'
import {
  reviewVacancy,
  vacancyReviewSchema,
} from '#server/services/vacancies/review-vacancy'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vacancy id',
    })
  }

  const body = await readValidatedBody(event, value => vacancyReviewSchema.parse(value))
  return await reviewVacancy(id, body)
})
