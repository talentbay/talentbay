import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
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
  const [vacancy] = await db
    .select({ id: schema.vacancies.id })
    .from(schema.vacancies)
    .where(and(
      eq(schema.vacancies.id, vacancyID),
      eq(schema.vacancies.status, 'PUBLISHED'),
      eq(schema.vacancies.reviewStatus, 'VERIFIED'),
    ))
    .limit(1)

  if (!vacancy) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Published vacancy not found',
    })
  }

  const [application] = await db
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
