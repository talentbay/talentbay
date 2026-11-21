import { eq } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import { applicationContextRevision, applicationContextSelection } from '#server/services/vacancies/application-context'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import { getReviewedCandidateProfile } from '#server/services/candidates/profile'

export async function applicationInputFor(vacancyID: number, userID: number) {
  const [row] = await useDatabase().select(applicationContextSelection).from(schema.vacancies)
    .innerJoin(schema.organisations, eq(schema.vacancies.organisationID, schema.organisations.id))
    .where(eq(schema.vacancies.id, vacancyID))
  if (!row) throw new Error('Missing synthetic vacancy')
  const { candidateContext } = await getReviewedCandidateProfile(userID)
  return { disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true as const, expectedContext: applicationContextRevision(row), expectedCandidateContext: candidateContext }
}
