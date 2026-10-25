import { and, eq, getTableColumns, sql } from 'drizzle-orm'
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
  operation: 'CREATED' | 'UPDATED' | 'UNCHANGED'
}

export async function importVacancies(
  items: VacancyImportItem[],
): Promise<VacancyImportResult[]> {
  const db = useDatabase()

  return await db.transaction(async (tx) => {
    const results: VacancyImportResult[] = []

    for (const item of items) {
      await tx
        .insert(schema.organisations)
        .values({
          name: item.company.name,
          slug: item.company.slug,
          websiteUrl: item.company.websiteUrl ?? null,
        })
        .onConflictDoNothing({ target: schema.organisations.slug })

      // Serialize changes to shared company metadata before touching its vacancies.
      const [organisation] = await tx.select().from(schema.organisations)
        .where(eq(schema.organisations.slug, item.company.slug))
        .for('update')

      if (!organisation) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to import organisation',
        })
      }

      const organisationChanged = organisation.name !== item.company.name
        || organisation.websiteUrl !== (item.company.websiteUrl ?? null)
      if (organisationChanged) {
        await tx.update(schema.organisations).set({
          name: item.company.name,
          websiteUrl: item.company.websiteUrl ?? null,
          updatedAt: new Date(),
        }).where(eq(schema.organisations.id, organisation.id))
        await tx.update(schema.vacancies).set({
          status: sql`case when ${schema.vacancies.status} = 'ARCHIVED' then 'ARCHIVED'::vacancy_status else 'DRAFT'::vacancy_status end`,
          reviewStatus: 'UNREVIEWED',
          updatedAt: new Date(),
        }).where(eq(schema.vacancies.organisationID, organisation.id))
      }

      const [existing] = await tx
        .select({ id: schema.vacancies.id, slug: schema.vacancies.slug })
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
        summary: item.vacancy.summary ?? null,
        description: item.vacancy.description,
        employmentType: item.vacancy.employmentType,
        workplaceType: item.vacancy.workplaceType,
        seniority: item.vacancy.seniority ?? null,
        countryCode: item.vacancy.countryCode,
        city: item.vacancy.city ?? null,
        salaryMin: item.vacancy.salary?.min ?? null,
        salaryMax: item.vacancy.salary?.max ?? null,
        salaryCurrency: item.vacancy.salary?.currency ?? null,
        salaryPeriod: item.vacancy.salary?.period ?? null,
        skills: [...new Set(item.vacancy.skills)],
        relocationOffered: item.vacancy.relocationOffered,
        visaSponsorship: item.vacancy.visaSponsorship,
        sourceName: item.source.name,
        sourceUrl: item.source.url,
        sourceExternalID: item.source.externalId,
      }

      const columns = getTableColumns(schema.vacancies)
      const contentKeys = Object.keys(vacancyValues) as Array<keyof typeof vacancyValues>
      const contentChanged = sql.join(contentKeys.map(key =>
        sql`${columns[key]} is distinct from excluded.${sql.identifier(columns[key].name)}`,
      ), sql` or `)

      const [vacancy] = await tx
        .insert(schema.vacancies)
        .values({
          ...vacancyValues,
          reviewStatus: 'UNREVIEWED',
          publishedAt: item.vacancy.sourcePublishedAt ? new Date(item.vacancy.sourcePublishedAt) : null,
        })
        .onConflictDoUpdate({
          target: [
            schema.vacancies.sourceName,
            schema.vacancies.sourceExternalID,
          ],
          set: {
            ...vacancyValues,
            status: sql`case when ${schema.vacancies.status} = 'ARCHIVED' then 'ARCHIVED'::vacancy_status else 'DRAFT'::vacancy_status end`,
            reviewStatus: 'UNREVIEWED',
            publishedAt: null,
            updatedAt: new Date(),
          },
          setWhere: contentChanged,
        })
        .returning({
          id: schema.vacancies.id,
          slug: schema.vacancies.slug,
        })

      if (!vacancy && !existing) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to import vacancy',
        })
      }

      results.push({
        ...(vacancy ?? existing!),
        operation: !vacancy && !organisationChanged ? 'UNCHANGED' : existing ? 'UPDATED' : 'CREATED',
      })
    }

    return results
  })
}
