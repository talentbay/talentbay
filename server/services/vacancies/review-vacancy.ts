import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { vacancyRevision } from './admin-vacancy'

export const vacancyReviewSchema = z.object({
  reviewStatus: z.enum(['UNREVIEWED', 'VERIFIED', 'FLAGGED']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})

export type VacancyReview = z.infer<typeof vacancyReviewSchema>

export async function reviewVacancy(id: number, review: VacancyReview, expectedRevision?: string) {
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

    const [company] = await tx.select().from(schema.organisations)
      .where(eq(schema.organisations.id, existing.organisationID)).for('update')
    const [current] = await tx.select().from(schema.vacancies)
      .where(eq(schema.vacancies.id, id)).for('update')
    if (!current || !company || current.organisationID !== company.id
      || (expectedRevision && vacancyRevision(current, company) !== expectedRevision)) {
      throw createError({ statusCode: 409, statusMessage: 'Content changed. Reload the vacancy before reviewing it.' })
    }
    if (review.status === 'PUBLISHED' && company.status === 'ARCHIVED') {
      throw createError({ statusCode: 422, statusMessage: 'An archived company cannot publish vacancies' })
    }

    if (review.status === 'PUBLISHED' && company.status !== 'ACTIVE') {
      await tx
        .update(schema.organisations)
        .set({ status: 'ACTIVE', updatedAt: new Date() })
        .where(eq(schema.organisations.id, existing.organisationID))
    }

    const [updated] = await tx
      .update(schema.vacancies)
      .set({
        ...review,
        publishedAt: review.status === 'PUBLISHED' ? current.publishedAt ?? new Date() : null,
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
