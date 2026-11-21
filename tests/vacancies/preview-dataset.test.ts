import { afterEach, expect, it, vi } from 'vitest'
import type { Database } from '#server/db'
import { hasSingleDatabaseHost } from '#server/db'
import { requirePreviewDatasetTarget, previewDatasetName } from '#server/services/vacancies/preview-dataset'
import type { VacancyImportItem } from '#server/services/vacancies/import-schema'

vi.mock('#server/db', () => ({ hasSingleDatabaseHost: vi.fn() }))
const host = 'ep-fictional-pooler.test.neon.tech'
const item = (name: string) => ({ source: { name } }) as VacancyImportItem
const targets = [item(previewDatasetName)]
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks() })

function setup(pinned: string, actual: string, db: string, role: string) {
  vi.stubGlobal('createError', (error: object) => Object.assign(new Error(), error))
  vi.stubEnv('TALENTBAY_REVIEW_IMPORT_HOST', pinned)
  vi.stubEnv('TALENTBAY_TEST_DATABASE', '')
  vi.mocked(hasSingleDatabaseHost).mockImplementation(name => name === actual)
  const execute = vi.fn().mockResolvedValue([{ db, role }])
  return { tx: { execute } as unknown as Pick<Database, 'execute'>, execute }
}

it.each([
  [host, host, 'talentbay_mvp_preview', 'talentbay_review_runtime', true],
  [host, host, 'neondb', 'talentbay_review_runtime', false],
  [host, host, 'talentbay_mvp_preview', 'owner', false],
  [host, 'ep-other-pooler.test.neon.tech', 'talentbay_mvp_preview', 'talentbay_review_runtime', false],
  ['', host, 'talentbay_mvp_preview', 'talentbay_review_runtime', false],
] as const)('requires a pinned review endpoint, database and effective role (%s / %s / %s / %s)', async (pinned, actual, db, role, ok) => {
  const { tx } = setup(pinned, actual, db, role)
  const result = requirePreviewDatasetTarget(targets, tx)
  if (ok) await expect(result).resolves.toBeUndefined()
  else await expect(result).rejects.toMatchObject({ statusCode: 403 })
})

it('never admits local application rehearsal data on the hosted target, or mixes sources', async () => {
  const { tx, execute } = setup(host, host, 'talentbay_mvp_preview', 'talentbay_review_runtime')
  await expect(requirePreviewDatasetTarget([item('Local review fixture (fictional)')], tx)).rejects.toMatchObject({ statusCode: 403 })
  await expect(requirePreviewDatasetTarget([...targets, item('Own vacancy')], tx)).rejects.toMatchObject({ statusCode: 422 })
  await requirePreviewDatasetTarget([item('Own vacancy')], tx)
  expect(execute).not.toHaveBeenCalled()
})
