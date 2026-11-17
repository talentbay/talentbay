import { parse } from 'csv-parse/sync'
import { vacancyCsvByteLimit, vacancyCsvColumns, vacancyImportRowLimit } from '#shared/types/vacancy-import'
import type { ImportIssue, VacancyCsvColumn } from '#shared/types/vacancy-import'
import { importBatchIssues, vacancyImportItemSchema } from './import-schema'
import type { VacancyImportItem } from './import-schema'

const fields: Record<string, VacancyCsvColumn> = {
  'source.name': 'source_name', 'source.url': 'source_url', 'source.externalId': 'source_external_id',
  'company.name': 'company_name', 'company.slug': 'company_slug', 'company.websiteUrl': 'company_website_url',
  'vacancy.slug': 'vacancy_slug', 'vacancy.title': 'title', 'vacancy.summary': 'summary', 'vacancy.description': 'description',
  'vacancy.employmentType': 'employment_type', 'vacancy.workplaceType': 'workplace_type', 'vacancy.seniority': 'seniority',
  'vacancy.countryCode': 'country_code', 'vacancy.city': 'city', 'vacancy.salary.min': 'salary_min', 'vacancy.salary.max': 'salary_max',
  'vacancy.salary.currency': 'salary_currency', 'vacancy.salary.period': 'salary_period', 'vacancy.salary': 'salary_min',
  'vacancy.skills': 'skills', 'vacancy.relocationOffered': 'relocation_offered', 'vacancy.visaSponsorship': 'visa_sponsorship',
  'vacancy.sourcePublishedAt': 'source_published_at',
}

export function parseVacancyCsv(csv: string) {
  const issues: ImportIssue[] = []
  const items: { row: number, item: VacancyImportItem }[] = []
  const failure = (message: string) => ({ rowCount: 0, items, issues: [{ row: 0, field: 'file', message }] })
  if (Buffer.byteLength(csv, 'utf8') > vacancyCsvByteLimit) return failure('CSV exceeds 512 KiB')
  if (csv.includes('\0')) return failure('CSV must not contain NUL characters')
  let records: string[][]
  try { records = parse(csv, { bom: true, skip_empty_lines: true, trim: true, relax_column_count: true, max_record_size: 256 * 1024 }) as string[][] }
  catch { return failure('Malformed CSV quoting or record size. Use the comma-delimited UTF-8 template.') }
  const header = records.shift()
  if (!header?.length) return failure('CSV is empty')
  if (header.some(name => name.length > 64 || !/^[a-z_]+$/.test(name))) return failure('Invalid CSV header names. Use the documented template.')
  if (new Set(header).size !== header.length) return failure('Duplicate CSV header names')
  const missing = vacancyCsvColumns.filter(name => !header.includes(name))
  const unknown = header.filter(name => !vacancyCsvColumns.includes(name as VacancyCsvColumn))
  if (missing.length || unknown.length) return failure(`Template headers do not match. Missing: ${missing.join(', ') || 'none'}. Unknown: ${unknown.join(', ') || 'none'}.`)
  if (!records.length || records.length > vacancyImportRowLimit) return failure('CSV must contain between 1 and 50 data records')

  for (const [index, record] of records.entries()) {
    const row = index + 2
    if (record.length !== header.length) { issues.push({ row, field: 'record', message: `Expected ${header.length} columns; received ${record.length}` }); continue }
    const value = Object.fromEntries(header.map((name, position) => [name, record[position]!.trim()])) as Record<VacancyCsvColumn, string>
    const optional = (column: VacancyCsvColumn) => value[column] || undefined
    const number = (column: VacancyCsvColumn) => /^\d+$/.test(value[column]) ? Number(value[column]) : Number.NaN
    const boolean = (column: VacancyCsvColumn) => value[column] === '' ? false : value[column].toLowerCase() === 'true' ? true : value[column].toLowerCase() === 'false' ? false : value[column]
    const salary = [value.salary_min, value.salary_max, value.salary_currency, value.salary_period].some(Boolean)
      ? { min: number('salary_min'), max: number('salary_max'), currency: value.salary_currency, period: value.salary_period } : undefined
    const result = vacancyImportItemSchema.safeParse({
      source: { name: value.source_name, url: value.source_url, externalId: value.source_external_id },
      company: { name: value.company_name, slug: value.company_slug, websiteUrl: optional('company_website_url') },
      vacancy: {
        slug: value.vacancy_slug, title: value.title, summary: optional('summary'), description: value.description,
        employmentType: value.employment_type, workplaceType: value.workplace_type, seniority: optional('seniority'),
        countryCode: value.country_code, city: optional('city'), salary,
        skills: value.skills ? value.skills.split('|').map(skill => skill.trim()) : [],
        relocationOffered: boolean('relocation_offered'), visaSponsorship: boolean('visa_sponsorship'), sourcePublishedAt: optional('source_published_at'),
      },
    })
    if (result.success) items.push({ row, item: result.data })
    else for (const issue of result.error.issues) {
      const path = issue.path.filter(part => typeof part === 'string').join('.')
      issues.push({ row, field: fields[path] || path, message: issue.message })
    }
  }
  issues.push(...importBatchIssues(items))
  return { rowCount: records.length, items, issues: issues.slice(0, 200) }
}
