import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { getVacancyBySlug } from '#server/repositories/vacancies'
import { getAdminVacancy } from '#server/services/vacancies/admin-vacancy'
import { importVacancies, type VacancyImportItem } from '#server/services/vacancies/import-vacancies'
import { previewVacancyImport } from '#server/services/vacancies/import-preview'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const prefix = `provenance-${randomUUID()}`
const published = { status: 'PUBLISHED', reviewStatus: 'VERIFIED' } as const
const originalDate = '2024-02-01T10:00:00.123Z'
let admin: number, candidate: number
vi.stubGlobal('createError', (details: object) => Object.assign(new Error('Provenance fixture error'), details))
function item(key: string): VacancyImportItem {
  return {
    source: { name: prefix, externalId: key, url: 'https://example.invalid/fictional-role' },
    company: { name: 'Fictional Provenance Company', slug: `${prefix}-${key}` },
    vacancy: { slug: `${prefix}-${key}`, title: 'Fictional Provenance Engineer', description: 'A synthetic vacancy used only for local provenance regression checks.', employmentType: 'FULL_TIME', workplaceType: 'REMOTE', countryCode: 'GB', skills: [], relocationOffered: false, visaSponsorship: false, sourcePublishedAt: originalDate },
  }
}
const row = async (id: number) => (await sql`select * from vacancies where id=${id}`)[0]!
beforeAll(async () => {
  const users = await sql`insert into users(name,role) values ('Provenance Admin','ADMIN'),('Provenance Candidate','USER') returning id`
  admin = users[0]!.id; candidate = users[1]!.id
})
afterAll(async () => {
  await closeDatabase()
  await sql`delete from applications where vacancy_id in (select id from vacancies where source_name=${prefix})`
  await sql`delete from vacancies where source_name=${prefix}`
  await sql`delete from organisations where slug like ${`${prefix}%`}`
  if (admin && candidate) await sql`delete from users where id in (${admin},${candidate})`
  await sql.end(); vi.unstubAllGlobals()
})

describe('vacancy provenance separates source observations from human publication', () => {
  it('keeps import/source dates distinct, records current reviewer and exposes no reviewer identity publicly', async () => {
    const input = item('dates')
    const fetched = new Date('2026-10-01T12:00:00Z')
    const [created] = await importVacancies([input], { actorUserID: admin, sourceFetchedAt: fetched })
    const draft = await row(created!.id)
    expect(draft).toMatchObject({ published_at: null, talentbay_published_at: null, reviewed_at: null, reviewed_by_user_id: null, source_published_at: new Date(originalDate), source_fetched_at: fetched })
    expect(draft.last_imported_at).toBeInstanceOf(Date)
    expect(await getVacancyBySlug(created!.slug)).toBeUndefined()
    const detail = await getAdminVacancy(created!.id)
    await reviewVacancy(created!.id, published, detail.revision, admin)
    const checked = await row(created!.id)
    expect(checked.reviewed_by_user_id).toBe(admin)
    expect(checked.talentbay_published_at.getTime()).toBeGreaterThan(fetched.getTime())
    expect(checked.reviewed_at).toEqual(checked.talentbay_published_at)
    const publicRecord = await getVacancyBySlug(created!.slug)
    expect(publicRecord).toMatchObject({ publishedAt: checked.talentbay_published_at.toISOString(), provenance: { sourcePublishedAt: originalDate, sourceFetchedAt: fetched.toISOString(), reviewedAt: checked.reviewed_at.toISOString() } })
    expect(JSON.stringify(publicRecord)).not.toMatch(/reviewedBy|reviewer|Provenance Admin/)
    expect((await getAdminVacancy(created!.id)).reviewer).toMatchObject({ id: admin, name: 'Provenance Admin' })
  })

  it('refreshes observations without invalidating held previews/reviews or making a listing new', async () => {
    const input = item('unchanged')
    const [created] = await importVacancies([input], { sourceFetchedAt: new Date('2026-10-01T00:00:00Z') })
    await reviewVacancy(created!.id, published, undefined, admin)
    const before = await row(created!.id)
    const review = await getAdminVacancy(created!.id)
    const preview = await previewVacancyImport([input])
    const later = new Date('2026-10-02T00:00:00Z')
    expect((await importVacancies([input], { sourceFetchedAt: later }))[0]!.operation).toBe('UNCHANGED')
    const after = await row(created!.id)
    expect(after.source_fetched_at).toEqual(later)
    expect(after.last_imported_at.getTime()).toBeGreaterThanOrEqual(before.last_imported_at.getTime())
    expect({ ...after, last_imported_at: null, source_fetched_at: null }).toEqual({ ...before, last_imported_at: null, source_fetched_at: null })
    expect((await getAdminVacancy(created!.id)).revision).toBe(review.revision)
    expect((await previewVacancyImport([input])).revision).toBe(preview.revision)
    await importVacancies([input], { expectedRevision: preview.revision!, sourceFetchedAt: new Date('2026-09-01T00:00:00Z') })
    expect((await row(created!.id)).source_fetched_at).toEqual(later)
    await reviewVacancy(created!.id, published, review.revision, admin)
    const rechecked = await row(created!.id)
    expect(rechecked.talentbay_published_at).toEqual(before.talentbay_published_at)
    expect(rechecked.reviewed_at.getTime()).toBeGreaterThanOrEqual(before.reviewed_at.getTime())
  })

  it('does not claim an HTTP source observation for a CSV-only import', async () => {
    const input = item('csv')
    const [created] = await importVacancies([input])
    expect(await row(created!.id)).toMatchObject({ source_fetched_at: null, source_published_at: new Date(originalDate) })
    await expect(importVacancies([input], { sourceFetchedAt: new Date('invalid') })).rejects.toMatchObject({ statusCode: 400 })
  })

  it('withdraws source-date/content changes and company siblings without deleting applications', async () => {
    const first = item('change')
    const sibling = { ...item('sibling'), company: first.company }
    const records = await importVacancies([first, sibling])
    for (const record of records) await reviewVacancy(record.id, published, undefined, admin)
    const [application] = await sql`insert into applications(user_id,vacancy_id,cover_letter) values (${candidate},${records[0]!.id},'Keep this synthetic submission') returning id`
    const next = { ...first, vacancy: { ...first.vacancy, sourcePublishedAt: '2024-03-01T00:00:00Z' } }
    expect((await previewVacancyImport([next])).summary.withdrawnPublished).toBe(1)
    await importVacancies([next])
    expect(await row(records[0]!.id)).toMatchObject({ status: 'DRAFT', review_status: 'UNREVIEWED', talentbay_published_at: null, reviewed_at: null, reviewed_by_user_id: null })
    await reviewVacancy(records[0]!.id, published, undefined, admin)
    await importVacancies([{ ...next, company: { ...first.company, name: 'Corrected Fictional Company' } }])
    for (const record of records) expect(await row(record.id)).toMatchObject({ status: 'DRAFT', review_status: 'UNREVIEWED', talentbay_published_at: null, reviewed_at: null, reviewed_by_user_id: null })
    expect(await sql`select id,cover_letter from applications where id=${application!.id}`).toEqual([{ id: application!.id, cover_letter: 'Keep this synthetic submission' }])
  })

  it('never reconstructs legacy dates from ambiguous published_at, even during recheck', async () => {
    const input = item('legacy')
    const [created] = await importVacancies([input])
    await sql`update organisations set status='ACTIVE' where slug=${input.company.slug}`
    await sql`update vacancies set status='PUBLISHED',review_status='VERIFIED',published_at='2020-01-01T00:00:00Z',talentbay_published_at=null,source_published_at=null,last_imported_at=null where id=${created!.id}`
    expect(await getVacancyBySlug(created!.slug)).toMatchObject({ publishedAt: null, provenance: { sourcePublishedAt: null, reviewedAt: null, lastImportedAt: null } })
    await reviewVacancy(created!.id, published, undefined, admin)
    const checked = await row(created!.id)
    expect(checked).toMatchObject({ talentbay_published_at: null, source_published_at: null, reviewed_by_user_id: admin, published_at: new Date('2020-01-01T00:00:00Z') })
    expect(checked.reviewed_at).toBeInstanceOf(Date)
  })

  it('keeps archive/flag semantics and rejects a revoked reviewer without changing provenance', async () => {
    const input = item('maintenance')
    const [created] = await importVacancies([input])
    await reviewVacancy(created!.id, published, undefined, admin)
    const publishedRow = await row(created!.id)
    await reviewVacancy(created!.id, { status: 'ARCHIVED', reviewStatus: 'VERIFIED' }, undefined, admin)
    expect(await row(created!.id)).toMatchObject({ talentbay_published_at: null, reviewed_at: publishedRow.reviewed_at, reviewed_by_user_id: admin })
    await importVacancies([{ ...input, vacancy: { ...input.vacancy, title: 'Changed archived role' } }])
    expect(await row(created!.id)).toMatchObject({ status: 'ARCHIVED', reviewed_at: null, reviewed_by_user_id: null })
    await reviewVacancy(created!.id, { status: 'ARCHIVED', reviewStatus: 'FLAGGED' }, undefined, admin)
    const before = await row(created!.id)
    expect(before.reviewed_at).toBeInstanceOf(Date)
    await sql`update users set role='USER' where id=${admin}`
    try { await expect(reviewVacancy(created!.id, published, undefined, admin)).rejects.toMatchObject({ statusCode: 403 }) }
    finally { await sql`update users set role='ADMIN' where id=${admin}` }
    expect(await row(created!.id)).toEqual(before)
    await sql`update organisations set status='ARCHIVED' where slug=${input.company.slug}`
    await expect(reviewVacancy(created!.id, published, undefined, admin)).rejects.toMatchObject({ statusCode: 422 })
  })
})
