import { randomUUID } from 'node:crypto'
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { closeDatabase, schema, useDatabase } from '#server/db'
import { createApplication, listCandidateApplications, withdrawApplication } from '#server/services/candidates/applications'
import { applicationInputFor } from './helpers/application-input'

const companies: number[] = [], vacancies: number[] = [], users: number[] = []
let owner: number, other: number, companyID: number, vacancyID: number, slug: string

beforeEach(async () => {
  const db = useDatabase()
  const accounts = await db.insert(schema.users).values([{ name: 'History owner' }, { name: 'Other candidate' }]).returning({ id: schema.users.id })
  users.push(...accounts.map(account => account.id))
  owner = accounts[0]!.id
  other = accounts[1]!.id
  await db.insert(schema.candidateProfiles).values({ userID: owner, telegram: '@history_fixture' })
  slug = randomUUID()
  const [company] = await db.insert(schema.organisations).values({ name: 'Submitted company', slug, status: 'ACTIVE' }).returning({ id: schema.organisations.id })
  companyID = company!.id
  companies.push(companyID)
  const [vacancy] = await db.insert(schema.vacancies).values({
    organisationID: companyID, slug, title: 'Submitted role', city: 'Berlin', countryCode: 'DE',
    description: 'Synthetic role.', status: 'PUBLISHED', reviewStatus: 'VERIFIED', employmentType: 'FULL_TIME', workplaceType: 'REMOTE',
  }).returning({ id: schema.vacancies.id })
  vacancyID = vacancy!.id
  vacancies.push(vacancyID)
})

afterAll(async () => {
  const db = useDatabase()
  try {
    if (users.length) await db.delete(schema.users).where(inArray(schema.users.id, users))
    if (vacancies.length) await db.delete(schema.vacancies).where(inArray(schema.vacancies.id, vacancies))
    if (companies.length) await db.delete(schema.organisations).where(inArray(schema.organisations.id, companies))
  } finally { await closeDatabase() }
})

async function submit() {
  return createApplication(owner, vacancyID, { ...await applicationInputFor(vacancyID, owner), coverLetter: 'Submitted note.' })
}

describe('candidate application history', () => {
  it('links to the current public slug by vacancy ID while displaying submission-time details', async () => {
    const db = useDatabase()
    const receipt = await submit()
    const currentSlug = randomUUID()
    await db.update(schema.vacancies).set({ slug: currentSlug, title: 'Revised role', city: 'Paris', countryCode: 'FR' }).where(eq(schema.vacancies.id, vacancyID))
    await db.update(schema.organisations).set({ name: 'Revised company' }).where(eq(schema.organisations.id, companyID))
    expect((await listCandidateApplications(owner)).items[0]).toEqual({
      ...receipt, coverLetter: 'Submitted note.', handling: { stage: 'RECEIVED' },
      vacancy: { slug, title: 'Submitted role', companyName: 'Submitted company', city: 'Berlin', countryCode: 'DE' },
      publicVacancySlug: currentSlug,
    })
  })

  it.each(['archived vacancy', 'unverified vacancy', 'inactive company'] as const)('keeps the owned receipt and withdrawal available for an %s', async (reason) => {
    const db = useDatabase()
    const receipt = await submit()
    const [before] = (await listCandidateApplications(owner)).items
    expect(before).toMatchObject({ id: receipt.id, publicVacancySlug: slug })
    if (reason === 'inactive company') await db.update(schema.organisations).set({ status: 'ARCHIVED' }).where(eq(schema.organisations.id, companyID))
    else await db.update(schema.vacancies).set(reason === 'archived vacancy' ? { status: 'ARCHIVED' } : { reviewStatus: 'UNREVIEWED' }).where(eq(schema.vacancies.id, vacancyID))
    const active = await listCandidateApplications(owner, { status: 'active' })
    expect(active).toEqual({
      items: [{ ...before, publicVacancySlug: null }], total: 1, nextCursor: null, counts: { all: 1, active: 1, closed: 0 },
    })
    expect(await listCandidateApplications(other)).toEqual({ items: [], total: 0, nextCursor: null, counts: { all: 0, active: 0, closed: 0 } })
    await withdrawApplication(owner, receipt.id)
    expect((await listCandidateApplications(owner, { status: 'closed' })).items).toContainEqual({
      ...before, publicVacancySlug: null, status: 'WITHDRAWN', handling: { stage: 'CLOSED' },
    })
  })

  it('never presents current listing details as a legacy receipt, even after a public company change', async () => {
    const db = useDatabase()
    const [receipt] = await db.insert(schema.applications).values({ userID: other, vacancyID, status: 'VIEWED' }).returning({ id: schema.applications.id })
    const [before] = (await listCandidateApplications(other)).items
    expect(before).toMatchObject({ id: receipt!.id, status: 'VIEWED', vacancy: null, publicVacancySlug: slug })
    const [replacement] = await db.insert(schema.organisations).values({
      name: 'Different public company', slug: randomUUID(), status: 'ACTIVE',
    }).returning({ id: schema.organisations.id })
    companies.push(replacement!.id)
    const newSlug = randomUUID()
    await db.update(schema.vacancies).set({ organisationID: replacement!.id, title: 'Different public role', slug: newSlug }).where(eq(schema.vacancies.id, vacancyID))
    expect((await listCandidateApplications(other)).items).toEqual([{ ...before, publicVacancySlug: newSlug }])
    await db.update(schema.organisations).set({ status: 'DRAFT' }).where(eq(schema.organisations.id, replacement!.id))
    expect((await listCandidateApplications(other)).items).toEqual([{ ...before, vacancy: null, publicVacancySlug: null }])
  })
})
