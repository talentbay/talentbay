import assert from 'node:assert/strict'
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
