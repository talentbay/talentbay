import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { leverSourceSchema } from '#server/services/sources/lever-contract'
import { normalizeLeverJobs } from '#server/services/sources/lever-normalize'
import { importVacancies } from '#server/services/vacancies/import-vacancies'
import { previewVacancyImport } from '#server/services/vacancies/import-preview'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'
import { getVacancyBySlug } from '#server/repositories/vacancies'
import { createApplication } from '#server/services/candidates/applications'
import { applicationInputFor } from './helpers/application-input'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const site = `fixture-${randomUUID()}`
const source = leverSourceSchema.parse({ site, region: 'GLOBAL', company: { name: 'Fictional Lever Pilot', slug: site } })
const id = randomUUID()
let vacancyID: number, userID: number
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Source import test failed'), details))
afterAll(async () => {
  await closeDatabase()
  if (userID) await sql`delete from users where id=${userID}`
  if (vacancyID) await sql`delete from vacancies where id=${vacancyID}`
  await sql`delete from organisations where slug=${site}`
  await sql.end()
  vi.unstubAllGlobals()
})

describe('Lever adapter → existing import/review boundary', () => {
  it('dry-runs, imports drafts and retains published IDs/applications across idempotent and changed re-imports', async () => {
    const raw = {
      id, text: 'Fictional Lever Engineer', country: 'DE', workplaceType: 'remote',
      categories: { commitment: 'Full-time', location: 'Germany' },
      descriptionPlain: 'A fictional role testing the existing import contract and publication boundary.',
      hostedUrl: `https://jobs.lever.co/${site}/${id}`,
    }
    const normalized = normalizeLeverJobs(source, [raw])
    expect(normalized.issues).toEqual([])
    const preview = await previewVacancyImport(normalized.items)
    expect(preview).toMatchObject({ valid: true, summary: { created: 1 } })
    expect(await sql`select id from vacancies where source_external_id=${id}`).toHaveLength(0)
    const [created] = await importVacancies(normalized.items, { expectedRevision: preview.revision! })
    vacancyID = created!.id
    expect(await getVacancyBySlug(created!.slug)).toBeUndefined()
    expect((await sql`select status,review_status from vacancies where id=${vacancyID}`)[0]).toEqual({ status: 'DRAFT', review_status: 'UNREVIEWED' })
    await reviewVacancy(vacancyID, { status: 'PUBLISHED', reviewStatus: 'VERIFIED' })
    const [user] = await sql`insert into users (name) values ('Lever Candidate Fixture') returning id`
    userID = user!.id
    await sql`insert into candidate_profiles (user_id,telegram) values (${userID},'@lever_fixture')`
    const application = await createApplication(userID, vacancyID, await applicationInputFor(vacancyID))
    const same = normalizeLeverJobs(source, [{ ...raw, id: id.toUpperCase() }])
    expect((await importVacancies(same.items))[0]).toMatchObject({ id: vacancyID, operation: 'UNCHANGED' })
    expect(await getVacancyBySlug(created!.slug)).toMatchObject({ id: vacancyID })
    const changed = normalizeLeverJobs(source, [{ ...raw, text: 'Changed Fictional Lever Role' }])
    expect((await importVacancies(changed.items))[0]).toMatchObject({ id: vacancyID, operation: 'UPDATED' })
    expect(await getVacancyBySlug(created!.slug)).toBeUndefined()
    expect(await sql`select id from applications where id=${application.id}`).toHaveLength(1)
  })
})
