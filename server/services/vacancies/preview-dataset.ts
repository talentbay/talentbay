import { sql } from 'drizzle-orm'
import { hasSingleDatabaseHost } from '#server/db'
import type { Database } from '#server/db'
import type { VacancyImportItem } from './import-schema'

export const previewDatasetName = 'TalentBay preview dataset'
const localRehearsalName = 'Local review fixture (fictional)'

export async function requirePreviewDatasetTarget(items: VacancyImportItem[], tx: Pick<Database, 'execute'>) {
  const sources = new Set(items.map(item => item.source.name))
  if (!sources.has(previewDatasetName) && !sources.has(localRehearsalName)) return
  if (sources.size !== 1) throw createError({ statusCode: 422, statusMessage: 'Import demo records separately from other sources.' })
  const host = process.env.TALENTBAY_REVIEW_IMPORT_HOST || ''
  const review = sources.has(previewDatasetName) && /^ep-[a-z0-9-]+-pooler(?:\.[a-z0-9-]+)+\.neon\.tech$/.test(host) && hasSingleDatabaseHost(host)
  const local = process.env.CI === 'true' && process.env.TALENTBAY_TEST_DATABASE === 'disposable' && hasSingleDatabaseHost('127.0.0.1')
  if (review || local) {
    const [identity] = await tx.execute(sql`select current_database() as db, current_user as role`)
    if (review && identity?.db === 'talentbay_mvp_preview' && identity.role === 'talentbay_review_runtime') return
    if (local && identity?.db === 'talentbay_ci' && identity.role === 'talentbay_ci') return
  }
  throw createError({ statusCode: 403, statusMessage: 'Demo imports are not enabled for this database.' })
}
