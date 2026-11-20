import { and, eq, getTableColumns, sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import type { Database } from '#server/db'

import { vacancyImportRequestSchema } from './import-schema'
import type { VacancyImportItem } from './import-schema'
import { importedVacancyContent } from './import-content'
import { prepareVacancyImport } from './import-preview'
import { requirePreviewDatasetTarget } from './preview-dataset'
export { vacancyImportItemSchema, vacancyImportRequestSchema } from './import-schema'
export type { VacancyImportItem } from './import-schema'

export type VacancyImportResult = {
  id: number
  slug: string
  operation: 'CREATED' | 'UPDATED' | 'UNCHANGED'
}
export type ImportTransaction = Parameters<Parameters<Database['transaction']>[0]>[0]
type ImportOptions = { expectedRevision?: string, actorUserID?: number, sourceFetchedAt?: Date }

export async function importVacancies(
  items: VacancyImportItem[],
  options: ImportOptions = {},
): Promise<VacancyImportResult[]> {
  return await useDatabase().transaction(tx => importVacanciesInTransaction(tx, items, options))
}

/** Allows the source checkpoint and this bounded batch to commit or roll back together. */
export async function importVacanciesInTransaction(tx: ImportTransaction, items: VacancyImportItem[], options: ImportOptions = {}): Promise<VacancyImportResult[]> {
  items = vacancyImportRequestSchema.parse({ items }).items
  if (!options.expectedRevision) await requirePreviewDatasetTarget(items, tx)
  if (options.sourceFetchedAt && !Number.isFinite(options.sourceFetchedAt.getTime())) throw createError({ statusCode: 400, statusMessage: 'Invalid source observation date' })
  // Bounded batches share a lock; preview confirmation and writes are one transaction.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('talentbay:vacancy-import', 0))`)
  if (options.expectedRevision) {
    const preview = await prepareVacancyImport(items, tx, true)
    if (!preview.valid || preview.revision !== options.expectedRevision) {
      throw createError({ statusCode: 409, statusMessage: 'Import data changed. Validate the file again before importing.' })
    }
  }
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
    if (organisation.status === 'ARCHIVED') {
      throw createError({ statusCode: 422, statusMessage: 'Company is archived. Resolve its status before importing.' })
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
        reviewedAt: null, reviewedByUserID: null, talentbayPublishedAt: null,
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

    const vacancyValues = importedVacancyContent(item, organisation.id)
    const columns = getTableColumns(schema.vacancies)
    const contentKeys = Object.keys(vacancyValues) as Array<keyof typeof vacancyValues>
    const contentChanged = sql.join(contentKeys.map(key =>
      sql`${columns[key]} is distinct from excluded.${sql.identifier(columns[key].name)}`,
    ), sql` or `)

    const [vacancy] = await tx
      .insert(schema.vacancies)
      .values({
        ...vacancyValues,
        createdByUserID: options.actorUserID,
        reviewStatus: 'UNREVIEWED',
        publishedAt: null,
        lastImportedAt: new Date(), sourceFetchedAt: options.sourceFetchedAt ?? null,
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
          talentbayPublishedAt: null, reviewedAt: null, reviewedByUserID: null,
          lastImportedAt: new Date(),
          ...(options.sourceFetchedAt ? { sourceFetchedAt: sql`greatest(${schema.vacancies.sourceFetchedAt}, ${options.sourceFetchedAt.toISOString()}::timestamptz)` } : {}),
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
    if (!vacancy) {
      await tx.update(schema.vacancies).set({
        lastImportedAt: new Date(),
        ...(options.sourceFetchedAt ? { sourceFetchedAt: sql`greatest(${schema.vacancies.sourceFetchedAt}, ${options.sourceFetchedAt.toISOString()}::timestamptz)` } : {}),
        updatedAt: sql`${schema.vacancies.updatedAt}`,
      }).where(eq(schema.vacancies.id, existing!.id))
    }

    results.push({
      ...(vacancy ?? existing!),
      operation: !vacancy && !organisationChanged ? 'UNCHANGED' : existing ? 'UPDATED' : 'CREATED',
    })
  }

  return results
}
