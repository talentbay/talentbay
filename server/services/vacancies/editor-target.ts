import { and, eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { schema } from '#server/db'
import { vacancyRevision } from './admin-vacancy'
import type { ImportTransaction } from './import-vacancies'
import type { VacancyImportItem } from './import-schema'

export const editorTargetSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('create') }),
  z.strictObject({ mode: z.literal('edit'), id: z.int().positive().max(2_147_483_647), revision: z.string().regex(/^[a-f0-9]{64}$/) }),
])
export type EditorTarget = z.infer<typeof editorTargetSchema>

// Called under the shared import lock. Lock company then vacancy, like publication review.
export async function resolveEditorItem(tx: ImportTransaction, item: VacancyImportItem, target: EditorTarget, actorUserID: number) {
  const [actor] = await tx.select({ role: schema.users.role }).from(schema.users)
    .where(eq(schema.users.id, actorUserID)).for('share')
  if (actor?.role !== 'ADMIN') throw createError({ statusCode: 403, statusMessage: 'Operator access required' })
  const [company] = await tx.select().from(schema.organisations)
    .where(eq(schema.organisations.slug, item.company.slug)).for('update')
  if (target.mode === 'edit') {
    const [current] = await tx.select().from(schema.vacancies).where(eq(schema.vacancies.id, target.id)).for('update')
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
    if (!company || current.organisationID !== company.id || current.slug !== item.vacancy.slug
      || current.sourceName !== item.source.name || current.sourceExternalID !== item.source.externalId
      || vacancyRevision(current, company) !== target.revision)
      throw createError({ statusCode: 409, statusMessage: 'Vacancy changed. Reload the record before editing.' })
  }
  else {
    const [collision] = await tx.select({ id: schema.vacancies.id }).from(schema.vacancies).where(or(
      eq(schema.vacancies.slug, item.vacancy.slug),
      and(eq(schema.vacancies.sourceName, item.source.name), eq(schema.vacancies.sourceExternalID, item.source.externalId)),
    )).limit(1)
    if (collision) throw createError({ statusCode: 409, statusMessage: 'Vacancy key already exists. Open the existing record instead.' })
  }
  if (!company) return item
  // A single-record edit must never rename an employer or withdraw sibling vacancies.
  if (company.name !== item.company.name || (item.company.websiteUrl && item.company.websiteUrl !== company.websiteUrl))
    throw createError({ statusCode: 422, statusMessage: 'Company label does not match the existing company.', data: { issues: [
      { field: 'company.name', message: 'Use the existing company name and website, or a different company key for a new employer.' },
    ] } })
  return { ...item, company: { ...item.company, websiteUrl: company.websiteUrl ?? undefined } }
}
