import { reviewVacancies, vacanciesCsv } from './local-review/fixtures.mjs'

// These are persisted source keys, independent of the local rehearsal order.
const sourceIds = {
  'senior-backend-engineer-london': 'preview-1',
  'senior-frontend-engineer-amsterdam': 'preview-2',
  'staff-fullstack-engineer-remote-emea': 'preview-3',
  'platform-engineer-berlin': 'preview-4',
  'product-engineer-lisbon': 'preview-5',
  'data-engineer-amsterdam': 'preview-6',
  'quality-engineer-tallinn': 'preview-7',
}

if (process.argv.length > 2) {
  console.error('Usage: pnpm --silent demo:vacancies:csv (no arguments; CSV is written to stdout)')
  process.exitCode = 1
}
else {
  const bySlug = new Map(reviewVacancies.map(item => [item.vacancy.slug, item]))
  const items = Object.entries(sourceIds).map(([slug, externalId]) => {
    const item = bySlug.get(slug)
    if (!item) throw new Error(`Missing preview vacancy: ${slug}`)
    return { ...item, source: { ...item.source, name: 'TalentBay preview dataset', externalId } }
  })
  process.stdout.write(vacanciesCsv(items))
}
