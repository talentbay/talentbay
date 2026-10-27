import { createHash } from 'node:crypto'
import { schema } from '#server/db'

// Material candidate-facing content and the actual recipient, not review/observation times.
export const applicationContextSelection = {
  id: schema.vacancies.id, organisationID: schema.vacancies.organisationID,
  companyName: schema.organisations.name, slug: schema.vacancies.slug,
  title: schema.vacancies.title, summary: schema.vacancies.summary, description: schema.vacancies.description,
  countryCode: schema.vacancies.countryCode, city: schema.vacancies.city,
  workplaceType: schema.vacancies.workplaceType, employmentType: schema.vacancies.employmentType,
  seniority: schema.vacancies.seniority, salaryMin: schema.vacancies.salaryMin, salaryMax: schema.vacancies.salaryMax,
  salaryCurrency: schema.vacancies.salaryCurrency, salaryPeriod: schema.vacancies.salaryPeriod,
  skills: schema.vacancies.skills, relocationOffered: schema.vacancies.relocationOffered,
  visaSponsorship: schema.vacancies.visaSponsorship, sourceName: schema.vacancies.sourceName,
  sourceUrl: schema.vacancies.sourceUrl, sourceExternalID: schema.vacancies.sourceExternalID,
}

export type ApplicationContextRow = Pick<typeof schema.vacancies.$inferSelect, Exclude<keyof typeof applicationContextSelection, 'companyName'>> & { companyName: string }
const fields = Object.keys(applicationContextSelection) as (keyof ApplicationContextRow)[]

export function applicationContextRevision(row: ApplicationContextRow) {
  return `v1:${createHash('sha256').update(JSON.stringify(fields.map(field => row[field]))).digest('hex')}`
}
