import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'

export const vacancyReviewSchema = z.object({
  reviewStatus: z.enum(['UNREVIEWED', 'VERIFIED', 'FLAGGED']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})

export type VacancyReview = z.infer<typeof vacancyReviewSchema>

export async function reviewVacancy(id: number, review: VacancyReview) {
  if (review.status === 'PUBLISHED' && review.reviewStatus !== 'VERIFIED') {
    throw createError({
      statusCode: 422,
      statusMessage: 'Only verified vacancies can be published',
    })
  }

  const db = useDatabase()
  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: schema.vacancies.id,
        organisationID: schema.vacancies.organisationID,
      })
      .from(schema.vacancies)
      .where(eq(schema.vacancies.id, id))
      .limit(1)

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Vacancy not found',
      })
    }

    if (review.status === 'PUBLISHED') {
      await tx
        .update(schema.organisations)
        .set({ status: 'ACTIVE', updatedAt: new Date() })
        .where(eq(schema.organisations.id, existing.organisationID))
    }

    const [updated] = await tx
      .update(schema.vacancies)
      .set({
        ...review,
        publishedAt: review.status === 'PUBLISHED' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.vacancies.id, id))
      .returning({
        id: schema.vacancies.id,
        slug: schema.vacancies.slug,
        status: schema.vacancies.status,
        reviewStatus: schema.vacancies.reviewStatus,
      })

    return updated
  })
}
