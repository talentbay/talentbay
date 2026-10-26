import { and, desc, eq, lt } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { getCandidateProfile } from '#server/services/candidates/profile'
import type { AdminApplicationDetail, AdminApplicationsResponse } from '#shared/types/application-review'

export const applicationQueueQuery = z.object({
  status: z.enum(schema.applicationStatusEnum.enumValues).optional(),
  before: z.coerce.number().int().positive().max(2147483647).optional(),
})

export async function listAdminApplications(filters: z.infer<typeof applicationQueueQuery>): Promise<AdminApplicationsResponse> {
  const conditions = []
  if (filters.status) conditions.push(eq(schema.applications.status, filters.status))
  if (filters.before) conditions.push(lt(schema.applications.id, filters.before))
  const rows = await useDatabase().select({
    id: schema.applications.id, status: schema.applications.status, createdAt: schema.applications.createdAt,
    candidate: { id: schema.users.id, name: schema.users.name },
    vacancy: { slug: schema.vacancies.slug, title: schema.vacancies.title, companyName: schema.organisations.name, city: schema.vacancies.city, countryCode: schema.vacancies.countryCode },
  }).from(schema.applications)
    .innerJoin(schema.users, eq(schema.applications.userID, schema.users.id))
    .innerJoin(schema.vacancies, eq(schema.applications.vacancyID, schema.vacancies.id))
    .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
    .where(and(...conditions)).orderBy(desc(schema.applications.id)).limit(26)
  const items = rows.slice(0, 25).map(row => ({ ...row, createdAt: row.createdAt.toISOString() }))
  return { items, nextCursor: rows.length > 25 ? items.at(-1)!.id : null }
}

export async function getAdminApplication(id: number): Promise<AdminApplicationDetail> {
  const [row] = await useDatabase().select({
    id: schema.applications.id, status: schema.applications.status, coverLetter: schema.applications.coverLetter,
    createdAt: schema.applications.createdAt, userID: schema.applications.userID,
    vacancy: { slug: schema.vacancies.slug, title: schema.vacancies.title, companyName: schema.organisations.name, city: schema.vacancies.city, countryCode: schema.vacancies.countryCode },
  }).from(schema.applications)
    .innerJoin(schema.vacancies, eq(schema.applications.vacancyID, schema.vacancies.id))
    .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
    .where(eq(schema.applications.id, id)).limit(1)
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
  const { userID, ...application } = row
  return { ...application, createdAt: row.createdAt.toISOString(), candidate: await getCandidateProfile(userID) }
}

