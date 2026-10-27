import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { closeDatabase } from '#server/db'
import { applicationInputFor } from './helpers/application-input'
import {
  createApplication,
  listCandidateApplications,
} from '#server/services/candidates/applications'
import {
  getCandidateProfile,
  saveCandidateProfile,
} from '#server/services/candidates/profile'
import { importVacancies } from '#server/services/vacancies/import-vacancies'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'

const runID = randomUUID()
const suffix = runID.slice(0, 12)
const email = `integration-${suffix}@talentbay.invalid`
const companySlug = `integration-company-${suffix}`
const vacancySlug = `integration-engineer-${suffix}`
const sourceName = `TalentBay integration ${suffix}`
const sourceExternalID = `integration-${runID}`

const setupConnectionString = process.env.DATABASE_MIGRATION_URL
  || process.env.DATABASE_URL

if (!setupConnectionString) {
  throw new Error('Integration database is not configured')
}

const sql = postgres(setupConnectionString, {
  max: 1,
  prepare: false,
})

let userID: number
let vacancyID: number

describe('database-backed MVP workflows', () => {
  beforeAll(async () => {
    const [user] = await sql`
      insert into users (name, email)
      values ('Integration Candidate', ${email})
      returning id
    `

    if (!user) {
      throw new Error('Failed to create the integration user')
    }

    userID = user.id
  })

  afterAll(async () => {
    await closeDatabase()

    await sql`
      delete from applications
      where user_id in (
        select id from users where email = ${email}
      )
    `
    await sql`
      delete from candidate_profiles
      where user_id in (
        select id from users where email = ${email}
      )
    `
    await sql`
      delete from vacancies
      where source_name = ${sourceName}
        and source_external_id = ${sourceExternalID}
    `
    await sql`delete from organisations where slug = ${companySlug}`
    await sql`delete from users where email = ${email}`

    await sql.end({ timeout: 5 })
  })

  it('imports, reviews and publishes a vacancy', async () => {
    const [imported] = await importVacancies([{
      source: {
        name: sourceName,
        url: 'https://example.com/integration-vacancy',
        externalId: sourceExternalID,
      },
      company: {
        name: `Integration Company ${suffix}`,
        slug: companySlug,
        websiteUrl: 'https://example.com',
      },
      vacancy: {
        slug: vacancySlug,
        title: 'Integration Engineer',
        description: 'A database-backed vacancy used only for an isolated integration test.',
        employmentType: 'FULL_TIME',
        workplaceType: 'REMOTE',
        countryCode: 'GB',
        city: 'London',
        skills: ['TypeScript', 'PostgreSQL'],
        relocationOffered: true,
        visaSponsorship: true,
      },
    }])

    expect(imported?.operation).toBe('CREATED')
    vacancyID = imported!.id

    const reviewed = await reviewVacancy(vacancyID, {
      reviewStatus: 'VERIFIED',
      status: 'PUBLISHED',
    })

    expect(reviewed).toMatchObject({
      id: vacancyID,
      status: 'PUBLISHED',
      reviewStatus: 'VERIFIED',
    })

    const published = await listAdminVacancies({
      status: 'PUBLISHED',
      reviewStatus: 'VERIFIED',
    })

    expect(published.items).toContainEqual(expect.objectContaining({
      id: vacancyID,
      slug: vacancySlug,
      sourceName,
    }))
  })

  it('saves a candidate profile and applies to the published vacancy', async () => {
    const profile = await saveCandidateProfile(userID, {
      headline: 'Senior TypeScript Engineer',
      countryCode: 'DE',
      city: 'Berlin',
      githubUrl: 'https://github.com/integration-candidate',
    })

    expect(profile.profile).toMatchObject({
      headline: 'Senior TypeScript Engineer',
      countryCode: 'DE',
      city: 'Berlin',
    })
    await expect(getCandidateProfile(userID)).resolves.toEqual(profile)

    const application = await createApplication(
      userID,
      vacancyID,
      { ...await applicationInputFor(vacancyID), coverLetter: 'Integration test application.' },
    )

    expect(application.status).toBe('NEW')

    const applications = await listCandidateApplications(userID)
    expect(applications.total).toBe(1)
    expect(applications.items[0]).toMatchObject({
      id: application.id,
      status: 'NEW',
      vacancy: {
        slug: vacancySlug,
        title: 'Integration Engineer',
      },
    })
  })

  it('retains a contact-only profile and clears optional fields explicitly', async () => {
    const result = await saveCandidateProfile(userID, { headline: null, about: null, city: null, countryCode: null, githubUrl: null, phone: '+49 1234' })
    expect(result.profile).toMatchObject({ headline: null, phone: '+49 1234' })
    expect((await getCandidateProfile(userID)).profile?.phone).toBe('+49 1234')
  })
})
