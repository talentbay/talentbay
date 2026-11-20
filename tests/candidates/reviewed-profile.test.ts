import { expect, it, vi } from 'vitest'
import { useDatabase } from '#server/db'
import { getCandidateProfile, getReviewedCandidateProfile, saveCandidateProfile } from '#server/services/candidates/profile'
import { applicationCandidateReview } from '#server/services/candidates/application-candidate-context'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('#server/db', async () => {
  const schema = await import('#server/db/schema')
  const { drizzle } = await import('drizzle-orm/pg-proxy')
  return { schema, useDatabase: () => drizzle(query) }
})

it('decorates private profile reads and saves, not the base profile used by legacy admin detail', async () => {
  const result = { rows: [[17, 'Fixture', null, null, 17, 'Engineer', null, null, null, null, '@fixture_contact', null, null]] }
  query.mockResolvedValue(result)
  const base = await getCandidateProfile(17, useDatabase())
  expect(Object.keys(base).sort()).toEqual(['profile', 'user'])
  const expected = { ...base, candidateContext: applicationCandidateReview(base).candidateContext }
  await expect(getReviewedCandidateProfile(17)).resolves.toEqual(expected)
  query.mockResolvedValueOnce({ rows: [] })
  await expect(saveCandidateProfile(17, { headline: 'Engineer' })).resolves.toEqual(expected)
  expect(query).toHaveBeenCalledTimes(4)
})
