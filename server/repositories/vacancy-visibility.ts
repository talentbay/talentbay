import { and, eq } from 'drizzle-orm'
import { schema } from '#server/db'

export function publicVacancyConditions() {
  return and(
    eq(schema.vacancies.status, 'PUBLISHED'),
    eq(schema.vacancies.reviewStatus, 'VERIFIED'),
    eq(schema.organisations.status, 'ACTIVE'),
  )!
}
