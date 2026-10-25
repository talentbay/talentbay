import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { getAdminDashboard } from '#server/services/admin/dashboard'
import { getAdminVacancy } from '#server/services/vacancies/admin-vacancy'
import { previewVacancyImport } from '#server/services/vacancies/import-preview'
import { importVacancies, type VacancyImportItem } from '#server/services/vacancies/import-vacancies'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'

vi.stubGlobal('createError', (input: object) => Object.assign(new Error(), input))
const suffix = randomUUID()
const source = `Import review ${suffix}`
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const published = { status: 'PUBLISHED', reviewStatus: 'VERIFIED' } as const
function item(key: string): VacancyImportItem {
  return {
    source: { name: source, externalId: key, url: 'https://example.com/jobs/1' },
    company: { slug: `review-${suffix}-${key}`, name: 'Review company' },
    vacancy: { slug: `review-${suffix}-${key}`, title: 'Review Engineer', description: 'Complete review content for an isolated regression test.', employmentType: 'FULL_TIME', workplaceType: 'REMOTE', countryCode: 'GB', skills: [], relocationOffered: false, visaSponsorship: false },
  }
}
afterAll(async () => {
  await closeDatabase()
  await sql`delete from vacancies where source_name = ${source}`
  await sql`delete from organisations where slug like ${`review-${suffix}-%`}`
  await sql.end()
  vi.unstubAllGlobals()
})

describe('operator preview and versioned review', () => {
  it('dry runs without writes and imports atomically using the same revision', async () => {
    const input = item('dry')
    const before = await sql`select count(*)::integer as total from vacancies`
    const preview = await previewVacancyImport([input])
    expect(preview).toMatchObject({ valid: true, summary: { created: 1, updated: 0, unchanged: 0, withdrawnPublished: 0 } })
    expect(await sql`select count(*)::integer as total from vacancies`).toEqual(before)
    const [result] = await importVacancies([input], { expectedRevision: preview.revision! })
    expect(result?.operation).toBe('CREATED')
    await expect(importVacancies([input], { expectedRevision: preview.revision! })).rejects.toMatchObject({ statusCode: 409 })
    const same = await previewVacancyImport([input])
    expect(same.summary.unchanged).toBe(1)
    expect((await importVacancies([input], { expectedRevision: same.revision! }))[0]?.operation).toBe('UNCHANGED')
  })

  it('rejects any changed preview before creating other rows', async () => {
    const input = item('stale')
    const [record] = await importVacancies([input])
    const next = { ...input, vacancy: { ...input.vacancy, title: 'Changed role' } }
    const extra = item('must-not-exist')
    const preview = await previewVacancyImport([next, extra])
    await reviewVacancy(record!.id, published)
    await expect(importVacancies([next, extra], { expectedRevision: preview.revision! })).rejects.toMatchObject({ statusCode: 409 })
    expect(await sql`select id from vacancies where slug = ${extra.vacancy.slug}`).toHaveLength(0)
    expect((await getAdminVacancy(record!.id)).vacancy.title).toBe(input.vacancy.title)
  })

  it('previews company-wide publication impact and withdraws siblings', async () => {
    const first = item('company')
    const sibling = { ...item('sibling'), company: first.company }
    for (const result of await importVacancies([first, sibling])) await reviewVacancy(result.id, published)
    const next = { ...first, company: { ...first.company, name: 'Replacement company' } }
    const preview = await previewVacancyImport([next])
    expect(preview.summary).toMatchObject({ updated: 1, withdrawnPublished: 2 })
    await importVacancies([next], { expectedRevision: preview.revision! })
    const rows = await sql`select status, review_status from vacancies where source_name = ${source} and source_external_id in ('company', 'sibling')`
    expect(rows.every(row => row.status === 'DRAFT' && row.review_status === 'UNREVIEWED')).toBe(true)
  })

  it('rejects slug collisions and archived companies without writes', async () => {
    const input = item('collision')
    const [record] = await importVacancies([input])
    const conflicting = { ...item('other-source'), vacancy: input.vacancy }
    expect((await previewVacancyImport([conflicting])).issues[0]?.field).toBe('vacancy_slug')
    await sql`update organisations set status = 'ARCHIVED' where slug = ${input.company.slug}`
    expect((await previewVacancyImport([input])).valid).toBe(false)
    const detail = await getAdminVacancy(record!.id)
    await expect(reviewVacancy(record!.id, published, detail.revision)).rejects.toMatchObject({ statusCode: 422 })
    expect((await getAdminVacancy(record!.id)).company.status).toBe('ARCHIVED')
  })

  it('compares actual content even when timestamps are identical', async () => {
    const input = item('review-stale')
    const [record] = await importVacancies([input])
    const detail = await getAdminVacancy(record!.id)
    await sql`update vacancies set description = 'A replacement description with the same timestamp' where id = ${record!.id}`
    await expect(reviewVacancy(record!.id, published, detail.revision)).rejects.toMatchObject({ statusCode: 409 })
    const fresh = await getAdminVacancy(record!.id)
    await reviewVacancy(record!.id, published, fresh.revision)
    expect((await getAdminVacancy(record!.id)).vacancy.status).toBe('PUBLISHED')
  })

  it('serializes reversed multi-company batches and preserves atomic rollback', async () => {
    const first = item('lock-a'); const second = item('lock-b')
    await Promise.all([importVacancies([first, second]), importVacancies([second, first])])
    expect(await sql`select id from vacancies where source_name = ${source} and source_external_id in ('lock-a', 'lock-b')`).toHaveLength(2)
    const extra = item('rolled-back')
    await expect(importVacancies([extra, { ...item('bad-slug'), vacancy: first.vacancy }])).rejects.toThrow()
    expect(await sql`select id from vacancies where slug = ${extra.vacancy.slug}`).toHaveLength(0)
    expect(await sql`select id from organisations where slug = ${extra.company.slug}`).toHaveLength(0)
  })

  it('dashboard counts agree with actual public visibility and application statuses', async () => {
    const dashboard = await getAdminDashboard()
    const [visible] = await sql`select count(*)::integer as total from vacancies v join organisations o on o.id = v.organisation_id where v.status = 'PUBLISHED' and v.review_status = 'VERIFIED' and o.status = 'ACTIVE'`
    expect(dashboard.vacancies.published).toBe(visible!.total)
    const [applications] = await sql`select count(*)::integer as total from applications`
    expect(dashboard.applications).toBe(applications!.total)
    expect(dashboard.applicationStatuses.reduce((sum, row) => sum + row.count, 0)).toBe(dashboard.applications)
  })
})
