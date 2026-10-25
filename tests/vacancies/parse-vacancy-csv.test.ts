import { describe, expect, it } from 'vitest'
import { parseVacancyCsv } from '#server/services/vacancies/parse-vacancy-csv'
import { vacancyImportRequestSchema } from '#server/services/vacancies/import-schema'
import { vacancyCsvByteLimit, vacancyCsvColumns } from '#shared/types/vacancy-import'
import type { VacancyCsvColumn } from '#shared/types/vacancy-import'

function record(overrides: Partial<Record<VacancyCsvColumn, string>> = {}) {
  return {
    ...Object.fromEntries(vacancyCsvColumns.map(column => [column, ''])),
    source_name: 'Test feed', source_url: 'https://example.com/jobs/123', source_external_id: '123',
    company_name: 'Example Company', company_slug: 'example-company', vacancy_slug: 'test-engineer',
    title: 'Platform Engineer', description: 'A complete description for a synthetic fixture.',
    employment_type: 'FULL_TIME', workplace_type: 'REMOTE', country_code: 'DE', ...overrides,
  } as Record<VacancyCsvColumn, string>
}
function file(rows: ReturnType<typeof record>[], columns = [...vacancyCsvColumns] as string[]) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
  return [columns.join(','), ...rows.map(row => columns.map(column => quote(row[column as VacancyCsvColumn] || '')).join(','))].join('\r\n')
}

describe('fixed-template CSV validation', () => {
  it('uses CSV quoting for commas, escaped quotes, newlines and BOM', () => {
    const input = record({ description: 'Build "reliable", observable services.\nWork with platform teams.', skills: 'TypeScript|PostgreSQL', relocation_offered: 'true' })
    const result = parseVacancyCsv('\uFEFF' + file([input]))
    expect(result.issues).toEqual([])
    expect(result.items[0]?.item.vacancy).toMatchObject({ description: input.description, skills: ['TypeScript', 'PostgreSQL'], relocationOffered: true, visaSponsorship: false })
  })
  it('accepts documented columns in a different order without inventing mapping', () => {
    expect(parseVacancyCsv(file([record()], [...vacancyCsvColumns].reverse())).issues).toEqual([])
  })
  it('reports field errors from every record, including partially specified salaries', () => {
    const result = parseVacancyCsv(file([
      record({ salary_min: '100', salary_max: '50', salary_currency: 'EUR', salary_period: 'YEAR', source_url: 'javascript:bad' }),
      record({ source_external_id: '456', vacancy_slug: 'second-role', country_code: '12', visa_sponsorship: 'maybe', salary_min: '100' }),
    ]))
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, field: 'salary_max' }), expect.objectContaining({ row: 2, field: 'source_url' }),
      expect.objectContaining({ row: 3, field: 'country_code' }), expect.objectContaining({ row: 3, field: 'visa_sponsorship' }),
      expect.objectContaining({ row: 3, field: 'salary_max' }),
    ]))
  })
  it('rejects malformed quotes, duplicate headers, extra fields and ragged records', () => {
    expect(parseVacancyCsv('"broken').issues.length).toBeGreaterThan(0)
    expect(parseVacancyCsv(file([record()], [...vacancyCsvColumns, 'title'])).issues[0]?.message).toContain('Duplicate')
    expect(parseVacancyCsv(file([record()], [...vacancyCsvColumns, 'unknown'])).issues[0]?.message).toContain('Unknown')
    expect(parseVacancyCsv(file([record()]) + ',extra').issues[0]).toMatchObject({ row: 2, field: 'record' })
  })
  it('rejects duplicate source keys/slugs and inconsistent company data', () => {
    const result = parseVacancyCsv(file([record(), record({ company_name: 'Conflicting Company' })]))
    expect(result.issues.map(issue => issue.field)).toEqual(expect.arrayContaining(['source_external_id', 'vacancy_slug', 'company_slug']))
    expect(vacancyImportRequestSchema.safeParse({ items: result.items.map(row => row.item) }).success).toBe(false)
  })
  it('bounds bytes, records and NUL input without skipping data', () => {
    expect(parseVacancyCsv('x'.repeat(vacancyCsvByteLimit + 1)).issues[0]?.message).toContain('512')
    expect(parseVacancyCsv(file(Array.from({ length: 51 }, () => record()))).issues[0]?.message).toContain('50')
    expect(parseVacancyCsv(file([record({ title: 'Bad\0value' })])).issues[0]?.message).toContain('NUL')
    expect(parseVacancyCsv(vacancyCsvColumns.join(',')).issues[0]?.message).toContain('1 and 50')
  })
  it('rejects credential URLs, SQL integer overflow and invalid enum/currency values', () => {
    const result = parseVacancyCsv(file([record({ source_url: 'https://secret@example.com', salary_min: '500', salary_max: '2147483648', salary_currency: '123', salary_period: 'DAY' })]))
    expect(result.issues.map(issue => issue.field)).toEqual(expect.arrayContaining(['source_url', 'salary_max', 'salary_currency', 'salary_period']))
  })
  it('reports malformed URLs instead of throwing and losing other row errors', () => {
    const result = parseVacancyCsv(file([record({ source_url: 'not a URL', country_code: '123' })]))
    expect(result.issues.map(issue => issue.field)).toEqual(expect.arrayContaining(['source_url', 'country_code']))
  })
})
