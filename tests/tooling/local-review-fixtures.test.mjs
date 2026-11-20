import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parse } from 'csv-parse/sync'
import { reviewCsv, reviewVacancies } from '../../scripts/local-review/fixtures.mjs'

test('fictional vacancies disclose their status on the list and detail and describe their own work', () => {
  const summaries = new Set()
  for (const { source, vacancy } of reviewVacancies) {
    assert.equal(new URL(source.url).hostname, 'example.invalid')
    assert.match(vacancy.summary, /^Demo vacancy\. /)
    assert.match(vacancy.description, /^Demo vacancy\. .*fictional\./)
    assert.ok(vacancy.description.includes(vacancy.summary.slice('Demo vacancy. '.length)))
    assert.ok(vacancy.description.includes(vacancy.visaSponsorship ? 'Visa sponsorship included.' : 'No visa sponsorship.'))
    assert.ok(vacancy.description.includes(vacancy.relocationOffered ? 'Relocation allowance included.' : 'No relocation allowance.'))
    summaries.add(vacancy.summary)
  }
  assert.ok(reviewVacancies.length > 1)
  assert.equal(summaries.size, reviewVacancies.length)
  assert.ok(reviewVacancies.some(({ vacancy }) => vacancy.relocationOffered && !vacancy.visaSponsorship))
})

test('the operator CSV carries the same fictional role and support terms as its source fixture', () => {
  const rows = parse(reviewCsv(), { columns: true })
  assert.equal(rows.length, 1)
  const [row] = rows
  assert.equal(row.vacancy_slug, 'data-engineer-amsterdam')
  assert.equal(row.source_name, 'Local review fixture (fictional)')
  assert.equal(row.source_external_id, row.vacancy_slug)
  const { vacancy, source } = reviewVacancies.find(item => item.vacancy.slug === row.vacancy_slug)
  assert.equal(row.source_url, source.url)
  assert.equal(row.summary, vacancy.summary)
  assert.equal(row.description, vacancy.description)
  assert.equal(row.relocation_offered, String(vacancy.relocationOffered))
  assert.equal(row.visa_sponsorship, String(vacancy.visaSponsorship))
  assert.equal(row.salary_period, vacancy.salary.period)
  const remote = reviewVacancies.find(({ vacancy }) => vacancy.workplaceType === 'REMOTE')
  const [withoutSupport] = parse(reviewCsv(remote), { columns: true })
  assert.equal(withoutSupport.visa_sponsorship, 'false')
  assert.equal(withoutSupport.relocation_offered, 'false')
  assert.match(withoutSupport.description, /Remote within EMEA; Berlin is the team base/)
})

const root = new URL('../../', import.meta.url)
const exporter = 'scripts/export-preview-vacancies.mjs'
const legacySeed = 'scripts/seed-preview.mjs'
const template = 'public/templates/vacancies.csv'

function runCli(script, args = [], allowedReads = []) {
  const { error, status, stdout, stderr } = spawnSync(process.execPath, [
    '--permission', ...[script, ...allowedReads].map(path => `--allow-fs-read=${path}`), script, ...args,
  ], { cwd: root, env: {}, encoding: 'utf8' })
  assert.ifError(error)
  return { status, stdout, stderr }
}

test('preview export is byte-stable and preserves all seven fictional vacancies and their source keys', () => {
  const { scripts } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
  assert.equal(scripts['demo:vacancies:csv'], `node ${exporter}`)
  const run = () => runCli(exporter, [], ['scripts/local-review/fixtures.mjs', template])
  const first = run()
  assert.equal(first.status, 0, first.stderr)
  assert.equal(first.stderr, '')
  assert.deepEqual(run(), first)
  assert.equal(first.stdout.split('\n', 1)[0], readFileSync(new URL(template, root), 'utf8').trim())

  const rows = parse(first.stdout, { columns: true })
  assert.equal(rows.length, 7)
  assert.deepEqual(Object.fromEntries(rows.map(row => [row.vacancy_slug, row.source_external_id])), {
    'senior-backend-engineer-london': 'preview-1',
    'senior-frontend-engineer-amsterdam': 'preview-2',
    'staff-fullstack-engineer-remote-emea': 'preview-3',
    'platform-engineer-berlin': 'preview-4',
    'product-engineer-lisbon': 'preview-5',
    'data-engineer-amsterdam': 'preview-6',
    'quality-engineer-tallinn': 'preview-7',
  })
  for (const row of rows) {
    const { source, vacancy, company } = reviewVacancies.find(item => item.vacancy.slug === row.vacancy_slug)
    assert.equal(row.source_name, 'TalentBay preview dataset')
    assert.equal(row.source_url, source.url)
    assert.equal(row.company_name, company.name)
    assert.equal(row.title, vacancy.title)
    assert.equal(row.summary, vacancy.summary)
    assert.equal(row.description, vacancy.description)
    assert.equal(row.skills, vacancy.skills.join('|'))
    assert.equal(row.relocation_offered, String(vacancy.relocationOffered))
    assert.equal(row.visa_sponsorship, String(vacancy.visaSponsorship))
  }
})

test('preview export rejects flags and positional arguments before reading the template or emitting CSV', () => {
  for (const args of [['--output', 'vacancies.csv'], ['vacancies.csv']]) {
    const { status, stdout, stderr } = runCli(exporter, args, ['scripts/local-review/fixtures.mjs'])
    assert.equal(status, 1)
    assert.equal(stdout, '')
    assert.match(stderr, /^Usage: pnpm --silent demo:vacancies:csv/)
  }
})

test('legacy seed command fails without reading env files and directs operators to review the CSV', () => {
  const { scripts } = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'))
  assert.equal(scripts['db:seed:preview'], `node ${legacySeed}`)
  const { status, stdout, stderr } = runCli(legacySeed)
  assert.equal(status, 1)
  assert.equal(stdout, '')
  assert.match(stderr, /pnpm --silent demo:vacancies:csv.*review/i)
})
