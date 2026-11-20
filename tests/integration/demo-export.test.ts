import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { afterAll, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { getVacancyBySlug } from '#server/repositories/vacancies'
import { createApplication } from '#server/services/candidates/applications'
import { parseVacancyCsv } from '#server/services/vacancies/parse-vacancy-csv'
import { previewVacancyImport } from '#server/services/vacancies/import-preview'
import { importVacancies } from '#server/services/vacancies/import-vacancies'
import { reviewVacancy } from '#server/services/vacancies/review-vacancy'

vi.stubGlobal('createError', (input: { statusMessage: string }) => Object.assign(new Error(input.statusMessage), input))
const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false })
const csv = execFileSync(process.execPath, [fileURLToPath(new URL('../../scripts/export-preview-vacancies.mjs', import.meta.url))], { encoding: 'utf8', env: {} })
const { items: rows, issues } = parseVacancyCsv(csv)
const items = rows.map(row => row.item)
const published = { status: 'PUBLISHED', reviewStatus: 'VERIFIED' } as const

afterAll(async () => { await closeDatabase(); await sql.end(); vi.unstubAllGlobals() })

it('refuses preview, confirmed import and JSON import on an unapproved target without writing', async () => {
  vi.stubEnv('TALENTBAY_TEST_DATABASE', '')
  vi.stubEnv('TALENTBAY_REVIEW_IMPORT_HOST', 'ep-fictional-pooler.test.neon.tech')
  try {
    for (const run of [() => previewVacancyImport(items), () => importVacancies(items, { expectedRevision: '0'.repeat(64) }), () => importVacancies(items)]) {
      await expect(run()).rejects.toMatchObject({ statusCode: 403 })
    }
    expect(await sql`select 1 from organisations where slug = ${items[0]!.company.slug}`).toHaveLength(0)
  } finally { vi.unstubAllEnvs() }
})

it('imports the exported file as drafts, preserves an existing demo ID and never enables a public application', async () => {
  expect(issues).toEqual([])
  expect(items).toHaveLength(7)
  const [first] = items
  const companySlugs = [...new Set(items.map(item => item.company.slug))]
  expect(await sql`select 1 from organisations where slug in ${sql(companySlugs)}`).toHaveLength(0)
  try {
    const [legacy] = await importVacancies([{ ...first!, vacancy: { ...first!.vacancy, summary: 'Previous example role' } }])
    await reviewVacancy(legacy!.id, published)
    const preview = await previewVacancyImport(items)
    expect(preview).toMatchObject({ valid: true, summary: { updated: 1, created: 6, withdrawnPublished: 1 } })
    expect((await getVacancyBySlug(first!.vacancy.slug))?.summary).toBe('Previous example role')
    const records = await importVacancies(items, { expectedRevision: preview.revision! })
    expect(records[0]).toMatchObject({ id: legacy!.id, operation: 'UPDATED' })
    const states = await sql`select status, review_status from vacancies where id in ${sql(records.map(row => row.id))}`
    expect(states).toHaveLength(7)
    expect(states.every(row => row.status === 'DRAFT' && row.review_status === 'UNREVIEWED')).toBe(true)
    expect(await getVacancyBySlug(first!.vacancy.slug)).toBeUndefined()
    await reviewVacancy(legacy!.id, published)
    const same = await previewVacancyImport(items)
    expect(same.summary).toMatchObject({ unchanged: 7, withdrawnPublished: 0 })
    expect((await importVacancies(items, { expectedRevision: same.revision! })).every(row => row.operation === 'UNCHANGED')).toBe(true)
    const detail = await getVacancyBySlug(first!.vacancy.slug)
    expect(detail).toMatchObject({ id: legacy!.id, source: { status: 'DEMO', url: null } })
    expect(detail?.applicationContext).toBeUndefined()
    await expect(createApplication(1, legacy!.id, {
      disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true, expectedContext: `v1:${'0'.repeat(64)}`, expectedCandidateContext: `v1:${'0'.repeat(64)}`,
    })).rejects.toMatchObject({ statusCode: 404 })
  } finally {
    await sql`delete from vacancies where source_name = ${first!.source.name} and source_external_id in ${sql(items.map(item => item.source.externalId))}`
    await sql`delete from organisations where slug in ${sql(companySlugs)}`
  }
})
