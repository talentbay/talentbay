import { requireAdminSession } from '#server/utils/admin-session'
import { z } from 'zod'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'
import {
  reviewVacancy,
  vacancyReviewSchema,
} from '#server/services/vacancies/review-vacancy'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid vacancy id',
    })
  }

  const parsed = vacancyReviewSchema.extend({ revision: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(await readBoundedJson(event, 4096))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'A valid review and content revision are required' })
  const body = parsed.data
  return await reviewVacancy(id, { status: body.status, reviewStatus: body.reviewStatus }, body.revision, admin.id)
})
