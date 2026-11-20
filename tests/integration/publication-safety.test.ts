import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import { getVacancyBySlug, listVacancies, resolveVacancies } from '#server/repositories/vacancies'
import { createApplication } from '#server/services/candidates/applications'
import { importVacancies, type VacancyImportItem } from '#server/services/vacancies/import-vacancies'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'
import { applicationInputFor } from './helpers/application-input'

// Nitro supplies this auto-import in production; service tests run outside Nitro.
vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) =>
  Object.assign(new Error(input.statusMessage), input))

const suffix = randomUUID()
const sourceName = `Publication regression ${suffix}`
const sql = postgres(process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL!, { max: 1, prepare: false })
const query = { q: '', sort: 'newest' as const, limit: 50 }
const applicationInput = { disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true as const, expectedContext: `v1:${'0'.repeat(64)}`, expectedCandidateContext: `v1:${'0'.repeat(64)}` }

function item(id: string): VacancyImportItem {
  return {
    source: { name: sourceName, url: 'https://example.com/jobs/123', externalId: id },
    company: { name: 'Publication Test Company', slug: `publication-${suffix}-${id}` },
    vacancy: {
      slug: `publication-${suffix}-${id}`,
      title: `Publication Engineer ${suffix}`,
      description: 'A vacancy created for an isolated publication regression test.',
      employmentType: 'FULL_TIME', workplaceType: 'REMOTE', countryCode: 'GB',
      skills: ['TypeScript'], relocationOffered: false, visaSponsorship: false,
    },
  }
}

async function published(input: VacancyImportItem) {
  const [result] = await importVacancies([input])
  await reviewVacancy(result!.id, { reviewStatus: 'VERIFIED', status: 'PUBLISHED' })
  return result!
}

afterAll(async () => {
  await closeDatabase()
  await sql`delete from applications where vacancy_id in (select id from vacancies where source_name = ${sourceName})`
  await sql`delete from users where email = ${`publication-${suffix}@talentbay.invalid`}`
  await sql`delete from vacancies where source_name = ${sourceName}`
  await sql`delete from organisations where slug like ${`publication-${suffix}-%`}`
  await sql.end()
  vi.unstubAllGlobals()
})

describe('import publication invariants', () => {
  it('searches company and skills as well as the role description', async () => {
    const input = item('search-fields')
    const token = suffix.replaceAll('-', '')
    input.company.name = `Orbital${token}`
    input.vacancy.skills = [`Elixir${token}`]
    const first = await published(input)
    expect((await listVacancies({ ...query, q: input.company.name })).items.map(value => value.id)).toContain(first.id)
    expect((await listVacancies({ ...query, q: input.vacancy.skills[0]! })).items.map(value => value.id)).toContain(first.id)
  })
  it('resolves a local shortlist in request order without leaking withdrawn records', async () => {
    const first = item('resolve-first')
    const second = item('resolve-second')
    const hidden = item('resolve-hidden')
    await published(first)
    await published(second)
    const concealed = await published(hidden)
    await sql`update vacancies set review_status = 'UNREVIEWED' where id = ${concealed.id}`
    const result = await resolveVacancies([second.vacancy.slug, hidden.vacancy.slug, first.vacancy.slug, second.vacancy.slug, 'missing-shortlist-role'])
    expect(result.items.map(value => value.slug)).toEqual([second.vacancy.slug, first.vacancy.slug])
    expect(result.unavailableSlugs).toEqual([hidden.vacancy.slug, 'missing-shortlist-role'])
  })
  it('withdraws changed content from list, detail and total, retaining IDs and applications', async () => {
    const input = item('changed')
    const first = await published(input)
    const [user] = await sql`insert into users (name, email) values ('Candidate', ${`publication-${suffix}@talentbay.invalid`}) returning id`
    await sql`insert into candidate_profiles (user_id, headline) values (${user!.id}, 'Publication fixture')`
    const application = await createApplication(user!.id, first.id, { ...await applicationInputFor(first.id, user!.id), coverLetter: 'Keep this application.' })
    const before = await listVacancies(query)

    const [updated] = await importVacancies([{ ...input, vacancy: { ...input.vacancy, title: 'Unreviewed replacement' } }])
    expect(updated).toMatchObject({ id: first.id, operation: 'UPDATED' })
    const [row] = await sql`select status, review_status from vacancies where id = ${first.id}`
    expect(row).toMatchObject({ status: 'DRAFT', review_status: 'UNREVIEWED' })
    expect(await getVacancyBySlug(input.vacancy.slug)).toBeUndefined()
    const after = await listVacancies(query)
    expect(after.items.some(v => v.id === first.id)).toBe(false)
    expect(after.total).toBe(before.total - 1)
    expect(await sql`select id from applications where id = ${application.id}`).toHaveLength(1)
    await expect(createApplication(user!.id, first.id, applicationInput)).rejects.toMatchObject({ statusCode: 404 })

    await reviewVacancy(first.id, { reviewStatus: 'VERIFIED', status: 'PUBLISHED' })
    expect(await getVacancyBySlug(input.vacancy.slug)).toMatchObject({ id: first.id, title: 'Unreviewed replacement' })
    expect((await listVacancies(query)).total).toBe(before.total)
  })

  it('keeps an unchanged import published without resetting its review/date', async () => {
    const input = item('unchanged')
    const first = await published(input)
    const [before] = await sql`select * from vacancies where id = ${first.id}`
    const [again] = await importVacancies([input])
    expect(again).toMatchObject({ id: first.id, operation: 'UNCHANGED' })
    const [after] = await sql`select * from vacancies where id = ${first.id}`
    expect(after!.last_imported_at.getTime()).toBeGreaterThanOrEqual(before!.last_imported_at.getTime())
    expect({ ...after, last_imported_at: null }).toEqual({ ...before, last_imported_at: null })
  })

  it('preserves archive status on changed re-import', async () => {
    const input = item('archived')
    const first = await published(input)
    await reviewVacancy(first.id, { reviewStatus: 'VERIFIED', status: 'ARCHIVED' })
    await importVacancies([{ ...input, vacancy: { ...input.vacancy, description: 'Changed content must never automatically restore an archived record.' } }])
    const [row] = await sql`select status, review_status from vacancies where id = ${first.id}`
    expect(row).toMatchObject({ status: 'ARCHIVED', review_status: 'UNREVIEWED' })
    expect(await getVacancyBySlug(input.vacancy.slug)).toBeUndefined()
  })

  it('hides legacy published/unreviewed records in list, detail and total', async () => {
    const input = item('legacy')
    const first = await published(input)
    const before = await listVacancies(query)
    await sql`update vacancies set review_status = 'UNREVIEWED' where id = ${first.id}`
    expect(await getVacancyBySlug(input.vacancy.slug)).toBeUndefined()
    const after = await listVacancies(query)
    expect(after.items.some(v => v.id === first.id)).toBe(false)
    expect(after.total).toBe(before.total - 1)
  })

  it('cannot apply when the organisation is inactive', async () => {
    const input = item('inactive')
    const first = await published(input)
    await sql`update organisations set status = 'ARCHIVED' where slug = ${input.company.slug}`
    await expect(createApplication(1, first.id, applicationInput)).rejects.toMatchObject({ statusCode: 404 })
    expect(await getVacancyBySlug(input.vacancy.slug)).toBeUndefined()
  })

  it('withdraws sibling vacancies when shared company details change', async () => {
    const input = item('company')
    const sibling = { ...item('sibling'), company: input.company }
    const first = await published(input)
    const second = await published(sibling)
    await importVacancies([{ ...input, company: { ...input.company, name: 'Unreviewed Company Name' } }])
    expect(await getVacancyBySlug(input.vacancy.slug)).toBeUndefined()
    expect(await getVacancyBySlug(sibling.vacancy.slug)).toBeUndefined()
    const rows = await sql`select id, status, review_status from vacancies where id in (${first.id}, ${second.id})`
    expect(rows).toHaveLength(2)
    expect(rows.every(row => row.status === 'DRAFT' && row.review_status === 'UNREVIEWED')).toBe(true)
  })

  it('clears removed nullable fields and keeps concurrent imports deduplicated', async () => {
    const input = item('concurrent')
    const withSalary = { ...input, vacancy: { ...input.vacancy, salary: { min: 50000, max: 80000, currency: 'GBP', period: 'YEAR' as const } } }
    const first = await published(withSalary)
    const results = await Promise.all([importVacancies([input]), importVacancies([input])])
    expect(results.flat().every(result => result.id === first.id)).toBe(true)
    const rows = await sql`select salary_min, salary_max, salary_currency, salary_period, status from vacancies where source_name = ${sourceName} and source_external_id = 'concurrent'`
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ salary_min: null, salary_max: null, salary_currency: null, salary_period: null, status: 'DRAFT' })
  })

  it('retains the DEMO marker for the preview dataset and rejects demo applications', async () => {
    const input = item('demo')
    const first = await published(input)
    await sql`update vacancies set source_name = 'TalentBay preview dataset' where id = ${first.id}`
    try {
      expect(await getVacancyBySlug(input.vacancy.slug)).toMatchObject({ source: { status: 'DEMO' } })
      await expect(createApplication(1, first.id, applicationInput)).rejects.toMatchObject({ statusCode: 404 })
    }
    finally {
      await sql`update vacancies set source_name = ${sourceName} where id = ${first.id}`
    }
  })
})
