import { count, eq } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'

async function countRows(
  table: typeof schema.users
    | typeof schema.organisations
    | typeof schema.vacancies
    | typeof schema.applications,
  where?: ReturnType<typeof eq>,
) {
  const db = useDatabase()
  const query = db.select({ value: count() }).from(table)
  const [row] = where ? await query.where(where) : await query

  return row?.value ?? 0
}

export async function getAdminDashboard() {
  const [
    users,
    organisations,
    totalVacancies,
    unreviewedVacancies,
    publishedVacancies,
    applications,
  ] = await Promise.all([
    countRows(schema.users),
    countRows(schema.organisations),
    countRows(schema.vacancies),
    countRows(schema.vacancies, eq(schema.vacancies.reviewStatus, 'UNREVIEWED')),
    countRows(schema.vacancies, eq(schema.vacancies.status, 'PUBLISHED')),
    countRows(schema.applications),
  ])

  return {
    users,
    organisations,
    vacancies: {
      total: totalVacancies,
      unreviewed: unreviewedVacancies,
      published: publishedVacancies,
    },
    applications,
  }
}
