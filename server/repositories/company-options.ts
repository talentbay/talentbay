import { and, asc, eq, exists, or, sql } from 'drizzle-orm'
import { schema, isDatabaseConfigured, useDatabase } from '#server/db'
import { demoVacancies } from '#server/data/demo-catalog'
import { publicVacancyConditions } from './vacancy-visibility'

const limit = 25
export async function listPublicCompanyOptions(search: string) {
  if (!isDatabaseConfigured()) {
    const needle = search.toLowerCase()
    const unique = new Map(demoVacancies.map(({ company }) => [company.slug, { slug: company.slug, name: company.name }]))
    return [...unique.values()].filter(c => c.name.toLowerCase().includes(needle) || c.slug.includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.slug.localeCompare(b.slug, 'en')).slice(0, limit)
  }
  const db = useDatabase()
  const org = schema.organisations
  // A label is public only while there is a publicly visible role at that company.
  return await db.select({ slug: org.slug, name: org.name }).from(org)
    .where(and(
      exists(db.select({ id: schema.vacancies.id }).from(schema.vacancies)
        .where(and(eq(schema.vacancies.organisationID, org.id), publicVacancyConditions()))),
      search ? or(sql`position(lower(${search}) in lower(${org.name})) > 0`, sql`position(lower(${search}) in ${org.slug}) > 0`) : undefined,
    )).orderBy(asc(org.name), asc(org.slug)).limit(limit)
}
