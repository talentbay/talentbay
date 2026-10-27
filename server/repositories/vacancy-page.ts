import { and, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { schema } from '#server/db'
import type { NormalizedVacancySearch, VacancyCursor } from '#server/services/vacancies/search-query'

/** Provider/legacy timestamps can have microseconds: keep a text key, not a JS Date key. */
export const pageDate = sql<string | null>`to_char(${schema.vacancies.publishedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`

export function olderVacancies(query: NormalizedVacancySearch, cursor: VacancyCursor) {
  const table = schema.vacancies
  const date = cursor.date === null
    ? and(isNull(table.publishedAt), lt(table.id, cursor.id))!
    : or(isNull(table.publishedAt), sql`${table.publishedAt} < ${cursor.date}::timestamptz`, and(sql`${table.publishedAt} = ${cursor.date}::timestamptz`, lt(table.id, cursor.id)))!
  return query.sort === 'salary-desc'
    ? or(lt(table.salaryMax, cursor.salary!), and(eq(table.salaryMax, cursor.salary!), date))!
    : date
}

export function vacancyOrder(query: NormalizedVacancySearch) {
  const table = schema.vacancies
  const date = sql`${table.publishedAt} desc nulls last`
  return query.sort === 'salary-desc'
    ? [sql`${table.salaryMax} desc`, date, sql`${table.id} desc`]
    : [date, sql`${table.id} desc`]
}
export const salaryPresent = () => and(isNotNull(schema.vacancies.salaryMin), isNotNull(schema.vacancies.salaryMax))!
