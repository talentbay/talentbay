import { describe, expect, it } from 'vitest'
import { applicationContextRevision } from '#server/services/vacancies/application-context'
import type { ApplicationContextRow } from '#server/services/vacancies/application-context'

const row: ApplicationContextRow = {
  id: 1, organisationID: 2, companyName: 'Fictional Company', slug: 'fixture',
  title: 'Engineer', summary: null, description: 'Original duties', countryCode: 'DE', city: null,
  workplaceType: 'REMOTE', employmentType: 'FULL_TIME', seniority: null,
  salaryMin: 50_000, salaryMax: 70_000, salaryCurrency: 'EUR', salaryPeriod: 'YEAR',
  skills: ['TypeScript'], relocationOffered: false, visaSponsorship: false,
  sourceName: 'Fixture source', sourceUrl: 'https://example.invalid/role', sourceExternalID: 'fixture-id',
}

describe('application context fingerprint', () => {
  it('is a deterministic versioned fingerprint, not a timestamp or recipient ID', () => {
    expect(applicationContextRevision(row)).toMatch(/^v1:[a-f0-9]{64}$/)
    expect(applicationContextRevision({ ...row, skills: [...row.skills] })).toBe(applicationContextRevision(row))
  })
  it('changes for recipient identity and material role terms even without an updated timestamp', () => {
    for (const change of [{ organisationID: 3 }, { companyName: 'Another Company' }, { description: 'Different duties' }, { salaryMin: 60_000 }, { skills: ['Go'] }, { sourceExternalID: 'another-id' }]) {
      expect(applicationContextRevision({ ...row, ...change })).not.toBe(applicationContextRevision(row))
    }
  })
  it('does not turn observation or moderation metadata into new candidate consent', () => {
    const rechecked = { ...row, reviewedAt: new Date(), reviewedByUserID: 8, sourceFetchedAt: new Date(), lastImportedAt: new Date(), updatedAt: new Date() }
    expect(applicationContextRevision(rechecked)).toBe(applicationContextRevision(row))
  })
})
