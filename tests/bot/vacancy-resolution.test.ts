import { beforeEach, expect, it, vi } from 'vitest'
import { makeVacancyStart } from '#shared/utils/telegram-vacancy-entry'
import { applicationContextRevision, applicationContextSelection } from '#server/services/vacancies/application-context'
import type { ApplicationContextRow } from '#server/services/vacancies/application-context'
import { publicVacancySlugForStart } from '#server/repositories/vacancies'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('#server/db', async () => {
  const schema = await import('#server/db/schema')
  const { drizzle } = await import('drizzle-orm/pg-proxy')
  return { schema, useDatabase: () => drizzle(query) }
})

const original: ApplicationContextRow = {
  id: 17, organisationID: 41, companyName: 'Fixture recipient', slug: 'verified-engineer', title: 'Fixture role',
  summary: null, description: 'Synthetic duties', city: null, countryCode: 'DE', workplaceType: 'REMOTE',
  employmentType: 'FULL_TIME', seniority: null, salaryMin: null, salaryMax: null, salaryCurrency: null,
  salaryPeriod: null, skills: [], relocationOffered: false, visaSponsorship: false, sourceName: null,
  sourceUrl: null, sourceExternalID: null,
}
const payload = makeVacancyStart(original.id, applicationContextRevision(original))!
function result(row: ApplicationContextRow) {
  const columns = Object.keys(applicationContextSelection) as (keyof ApplicationContextRow)[]
  query.mockResolvedValue({ rows: [columns.map(key => row[key])] })
}
beforeEach(() => { query.mockReset() })

it('resolves a pinned material row to its slug with one public non-demo lookup', async () => {
  result(original)
  expect(await publicVacancySlugForStart(original.id, payload)).toBe(original.slug)
  expect(query).toHaveBeenCalledTimes(1)
  const [statement, params] = query.mock.calls[0]!
  expect(statement).toContain('inner join "organisations"')
  expect(statement).toContain('is distinct from $5')
  expect(params).toEqual([original.id, 'PUBLISHED', 'VERIFIED', 'ACTIVE', 'TalentBay preview dataset', 1])
})

it('does not retarget a pin when the receiving company or the vacancy title changes under the same ID', async () => {
  for (const change of [{ organisationID: 42 }, { title: 'Changed terms' }]) {
    result({ ...original, ...change })
    expect(await publicVacancySlugForStart(original.id, payload)).toBeNull()
  }
  query.mockResolvedValue({ rows: [] })
  expect(await publicVacancySlugForStart(original.id, payload)).toBeNull()
})
