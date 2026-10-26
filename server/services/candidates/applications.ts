import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { publicVacancyConditions } from '#server/repositories/vacancy-visibility'
import type {
  CandidateApplicationItem,
  CandidateApplicationsResponse,
} from '#shared/types/candidates'

export const applicationInputSchema = z.object({
  coverLetter: z.string().trim().max(5_000).nullable().optional(),
})

export async function createApplication(
  userID: number,
  vacancyID: number,
  coverLetter?: string | null,
) {
  const db = useDatabase()
  return await db.transaction(async (tx) => {
    const [vacancy] = await tx
      .select({ id: schema.vacancies.id })
      .from(schema.vacancies)
      .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
      .where(and(
        eq(schema.vacancies.id, vacancyID),
        publicVacancyConditions(),
        sql`${schema.vacancies.sourceName} is distinct from 'TalentBay preview dataset'`,
      ))
      .limit(1)
      .for('share')

    if (!vacancy) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Published vacancy not found',
      })
    }

    const [application] = await tx
      .insert(schema.applications)
      .values({
        userID,
        vacancyID,
        coverLetter: coverLetter || null,
      })
      .onConflictDoNothing()
      .returning({
        id: schema.applications.id,
        status: schema.applications.status,
        createdAt: schema.applications.createdAt,
      })

    if (!application) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You have already applied to this vacancy',
      })
    }

    return {
      ...application,
      createdAt: application.createdAt.toISOString(),
    }
  })
}

export async function listCandidateApplications(
  userID: number,
): Promise<CandidateApplicationsResponse> {
  const db = useDatabase()
  const rows = await db
    .select({
      id: schema.applications.id,
      status: schema.applications.status,
      coverLetter: schema.applications.coverLetter,
      createdAt: schema.applications.createdAt,
      slug: schema.vacancies.slug,
      title: schema.vacancies.title,
      companyName: schema.organisations.name,
      city: schema.vacancies.city,
      countryCode: schema.vacancies.countryCode,
    })
    .from(schema.applications)
    .innerJoin(
      schema.vacancies,
      eq(schema.applications.vacancyID, schema.vacancies.id),
    )
    .innerJoin(
      schema.organisations,
      eq(schema.vacancies.organisationID, schema.organisations.id),
    )
    .where(eq(schema.applications.userID, userID))
    .orderBy(desc(schema.applications.createdAt))

  const items: CandidateApplicationItem[] = rows.map(row => ({
    id: row.id,
    status: row.status,
    coverLetter: row.coverLetter,
    createdAt: row.createdAt.toISOString(),
    vacancy: {
      slug: row.slug,
      title: row.title,
      companyName: row.companyName,
      city: row.city,
      countryCode: row.countryCode,
    },
  }))

  return {
    items,
    total: items.length,
  }
}

export async function withdrawApplication(userID: number, id: number) {
  return await useDatabase().transaction(async (tx) => {
    const [row] = await tx.select().from(schema.applications)
      .where(and(eq(schema.applications.id, id), eq(schema.applications.userID, userID))).for('update')
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    if (row.status === 'WITHDRAWN') return { id: row.id, status: row.status }
    if (row.status === 'REJECTED') throw createError({ statusCode: 409, statusMessage: 'This application is already closed' })
    const [updated] = await tx.update(schema.applications).set({ status: 'WITHDRAWN' }).where(eq(schema.applications.id, id))
      .returning({ id: schema.applications.id, status: schema.applications.status })
    return updated!
  })
}
