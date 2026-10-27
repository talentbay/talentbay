import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { vacancyRevision } from './admin-vacancy'

export const vacancyReviewSchema = z.object({
  reviewStatus: z.enum(['UNREVIEWED', 'VERIFIED', 'FLAGGED']),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
}).strict()

export type VacancyReview = z.infer<typeof vacancyReviewSchema>

export async function reviewVacancy(id: number, review: VacancyReview, expectedRevision?: string, actorUserID?: number) {
  if (review.status === 'PUBLISHED' && review.reviewStatus !== 'VERIFIED') {
    throw createError({
      statusCode: 422,
      statusMessage: 'Only verified vacancies can be published',
    })
  }

  const db = useDatabase()
  return await db.transaction(async (tx) => {
    if (actorUserID !== undefined) {
      const [actor] = await tx.select({ role: schema.users.role }).from(schema.users).where(eq(schema.users.id, actorUserID)).for('share')
      if (actor?.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Current reviewer access required' })
    }
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

    const now = new Date()
    const publishing = review.status === 'PUBLISHED'
    const newPublication = publishing && current.status !== 'PUBLISHED'
    const decided = publishing || (review.reviewStatus === 'FLAGGED' && current.reviewStatus !== 'FLAGGED')
    const reset = review.reviewStatus === 'UNREVIEWED'
    const [updated] = await tx
      .update(schema.vacancies)
      .set({
        ...review,
        publishedAt: publishing ? newPublication ? now : current.publishedAt : null,
        talentbayPublishedAt: publishing ? newPublication ? now : current.talentbayPublishedAt : null,
        reviewedAt: reset ? null : decided ? actorUserID === undefined ? null : now : current.reviewedAt,
        reviewedByUserID: reset ? null : decided ? actorUserID ?? null : current.reviewedByUserID,
        // An unchanged recheck refreshes provenance, not the legacy content revision.
        updatedAt: review.status === current.status && review.reviewStatus === current.reviewStatus ? current.updatedAt : now,
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
