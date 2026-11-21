import { createHash } from 'node:crypto'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import type { Database } from '#server/db'
import type { ImportIssue, VacancyImportPreview } from '#shared/types/vacancy-import'
import { importedVacancyContent, reviewedVacancyState, sameImportedContent } from './import-content'
import { vacancyImportRequestSchema } from './import-schema'
import type { VacancyImportItem } from './import-schema'
import { requirePreviewDatasetTarget } from './preview-dataset'

type ImportReader = Pick<Database, 'select' | 'execute'>
const sourceKey = (name: string | null, id: string | null) => JSON.stringify([name, id])

export async function prepareVacancyImport(items: VacancyImportItem[], db: ImportReader, lock = false): Promise<VacancyImportPreview> {
  await requirePreviewDatasetTarget(items, db)
  const companyQuery = db.select().from(schema.organisations)
    .where(inArray(schema.organisations.slug, items.map(item => item.company.slug))).orderBy(asc(schema.organisations.id))
  // Mutating imports lock companies before vacancies, matching the review lock order.
  const companies = lock ? await companyQuery.for('update') : await companyQuery
  const vacancyQuery = db.select().from(schema.vacancies).where(or(
    inArray(schema.vacancies.slug, items.map(item => item.vacancy.slug)),
    ...items.map(item => and(eq(schema.vacancies.sourceName, item.source.name), eq(schema.vacancies.sourceExternalID, item.source.externalId))),
  )).orderBy(asc(schema.vacancies.id))
  const existing = lock ? await vacancyQuery.for('update') : await vacancyQuery
  const bySource = new Map(existing.map(row => [sourceKey(row.sourceName, row.sourceExternalID), row]))
  const bySlug = new Map(existing.map(row => [row.slug, row]))
  const byCompany = new Map(companies.map(row => [row.slug, row]))
  const changedCompanies = new Set<number>()
  const changedVacancies: number[] = []
  const issues: ImportIssue[] = []
  const summary = { created: 0, updated: 0, unchanged: 0, withdrawnPublished: 0 }
  const rows: VacancyImportPreview['rows'] = items.map((item, index) => {
    const row = index + 2
    const company = byCompany.get(item.company.slug)
    if (company?.status === 'ARCHIVED') issues.push({ row, field: 'company_slug', message: 'Company is archived. Resolve its status before importing.' })
    const changedCompany = company && (company.name !== item.company.name || company.websiteUrl !== (item.company.websiteUrl ?? null))
    if (changedCompany) changedCompanies.add(company.id)
    const previous = bySource.get(sourceKey(item.source.name, item.source.externalId))
    const slugOwner = bySlug.get(item.vacancy.slug)
    if (slugOwner && slugOwner.id !== previous?.id) issues.push({ row, field: 'vacancy_slug', message: 'This slug already belongs to a different source record.' })
    const operation = !previous ? 'CREATED' : changedCompany || !sameImportedContent(previous, importedVacancyContent(item, company?.id ?? -1)) ? 'UPDATED' : 'UNCHANGED'
    if (operation === 'CREATED') summary.created++
    else if (operation === 'UPDATED') { summary.updated++; changedVacancies.push(previous!.id) }
    else summary.unchanged++
    return { row, slug: item.vacancy.slug, title: item.vacancy.title, company: item.company.name, operation }
  })
  const [impact] = await db.select({
    total: sql<number>`count(*)::integer`,
    published: sql<number>`count(*) filter (where ${schema.vacancies.status} = 'PUBLISHED')::integer`,
    latest: sql<string | null>`max(${schema.vacancies.updatedAt})::text`,
  }).from(schema.vacancies).where(or(inArray(schema.vacancies.id, changedVacancies), inArray(schema.vacancies.organisationID, [...changedCompanies])))
  summary.withdrawnPublished = impact?.published ?? 0
  return {
    valid: issues.length === 0, rowCount: items.length, issues, rows, summary,
    revision: issues.length ? null : createHash('sha256').update(JSON.stringify({ items, companies, existing: existing.map(reviewedVacancyState), impact })).digest('hex'),
  }
}

export async function previewVacancyImport(input: VacancyImportItem[]) {
  const { items } = vacancyImportRequestSchema.parse({ items: input })
  return await useDatabase().transaction(tx => prepareVacancyImport(items, tx), {
    isolationLevel: 'repeatable read', accessMode: 'read only',
  })
}
