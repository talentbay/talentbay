import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'

const slugSchema = z.string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const salarySchema = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  currency: z.string().trim().length(3).transform(value => value.toUpperCase()),
  period: z.enum(['YEAR', 'MONTH', 'HOUR']),
}).refine(value => value.max >= value.min, {
  message: 'Salary maximum must be greater than or equal to minimum',
  path: ['max'],
})

export const vacancyImportItemSchema = z.object({
  source: z.object({
    name: z.string().trim().min(2).max(120),
    url: z.url(),
    externalId: z.string().trim().min(1).max(255),
  }),
  company: z.object({
    name: z.string().trim().min(2).max(160),
    slug: slugSchema,
    websiteUrl: z.url().optional(),
  }),
  vacancy: z.object({
    slug: slugSchema,
    title: z.string().trim().min(2).max(180),
    summary: z.string().trim().max(500).optional(),
    description: z.string().trim().min(20).max(50_000),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
    workplaceType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']),
    seniority: z.string().trim().max(80).optional(),
    countryCode: z.string().trim().length(2).transform(value => value.toUpperCase()),
    city: z.string().trim().max(120).optional(),
    salary: salarySchema.optional(),
    skills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    relocationOffered: z.boolean().default(false),
    visaSponsorship: z.boolean().default(false),
    sourcePublishedAt: z.iso.datetime({ offset: true }).optional(),
  }),
})

export const vacancyImportRequestSchema = z.object({
  items: z.array(vacancyImportItemSchema).min(1).max(50),
})

export type VacancyImportItem = z.infer<typeof vacancyImportItemSchema>

export type VacancyImportResult = {
  id: number
  slug: string
  operation: 'CREATED' | 'UPDATED'
}

export async function importVacancies(
  items: VacancyImportItem[],
): Promise<VacancyImportResult[]> {
  const db = useDatabase()

  return await db.transaction(async (tx) => {
    const results: VacancyImportResult[] = []

    for (const item of items) {
      const [organisation] = await tx
        .insert(schema.organisations)
        .values({
          name: item.company.name,
          slug: item.company.slug,
          websiteUrl: item.company.websiteUrl,
        })
        .onConflictDoUpdate({
          target: schema.organisations.slug,
          set: {
            name: item.company.name,
            websiteUrl: item.company.websiteUrl,
            updatedAt: new Date(),
          },
        })
        .returning({ id: schema.organisations.id })

      if (!organisation) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to import organisation',
        })
      }

      const [existing] = await tx
        .select({ id: schema.vacancies.id })
        .from(schema.vacancies)
        .where(and(
          eq(schema.vacancies.sourceName, item.source.name),
          eq(schema.vacancies.sourceExternalID, item.source.externalId),
        ))
        .limit(1)

      const vacancyValues = {
        organisationID: organisation.id,
        slug: item.vacancy.slug,
        title: item.vacancy.title,
        summary: item.vacancy.summary,
        description: item.vacancy.description,
        employmentType: item.vacancy.employmentType,
        workplaceType: item.vacancy.workplaceType,
        seniority: item.vacancy.seniority,
        countryCode: item.vacancy.countryCode,
        city: item.vacancy.city,
        salaryMin: item.vacancy.salary?.min,
        salaryMax: item.vacancy.salary?.max,
        salaryCurrency: item.vacancy.salary?.currency,
        salaryPeriod: item.vacancy.salary?.period,
        skills: [...new Set(item.vacancy.skills)],
        relocationOffered: item.vacancy.relocationOffered,
        visaSponsorship: item.vacancy.visaSponsorship,
        sourceName: item.source.name,
        sourceUrl: item.source.url,
        sourceExternalID: item.source.externalId,
        publishedAt: item.vacancy.sourcePublishedAt
          ? new Date(item.vacancy.sourcePublishedAt)
          : null,
        reviewStatus: 'UNREVIEWED' as const,
      }

      const [vacancy] = await tx
        .insert(schema.vacancies)
        .values(vacancyValues)
        .onConflictDoUpdate({
          target: [
            schema.vacancies.sourceName,
            schema.vacancies.sourceExternalID,
          ],
          set: {
            ...vacancyValues,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: schema.vacancies.id,
          slug: schema.vacancies.slug,
        })

      if (!vacancy) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to import vacancy',
        })
      }

      results.push({
        ...vacancy,
        operation: existing ? 'UPDATED' : 'CREATED',
      })
    }

    return results
  })
}
