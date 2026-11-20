import { describe, expect, it } from 'vitest'
import { editorialSourceName } from '#shared/types/vacancy-import'
import { editorSlug, vacancyEditorDraft, vacancyEditorItem } from '../../app/utils/vacancy-editor'
import { vacancyImportItemSchema } from '#server/services/vacancies/import-schema'

function draft() {
  return { ...vacancyEditorDraft(), title: 'Senior QA Engineer', company: 'Café Lab', country: 'gb', description: 'A fictional job to test the authoring flow.' }
}
describe('operator vacancy authoring', () => {
  it('accepts a first-party draft without an invented source or partner profile', () => {
    const item = vacancyImportItemSchema.parse(vacancyEditorItem(draft(), 'local-record-7'))
    expect(item.source).toEqual({ name: editorialSourceName, externalId: 'local-record-7', url: undefined })
    expect(item.company).toMatchObject({ slug: 'cafe-lab' })
    expect(item.vacancy).toMatchObject({ slug: 'senior-qa-engineer', countryCode: 'GB' })
    expect(editorSlug('A'.repeat(119) + ' job')).toHaveLength(119)
  })
  it('does not turn an unattributed external posting into editorial content', () => {
    const data = { ...draft(), external: true, sourceName: 'Fixture employer', externalId: 'source-01' }
    expect(vacancyImportItemSchema.safeParse(vacancyEditorItem(data, 'unused')).success).toBe(false)
    expect(vacancyImportItemSchema.parse(vacancyEditorItem({ ...data, url: 'https://example.invalid/jobs/1' }, 'unused')).source.externalId).toBe('source-01')
  })
  it('rejects incomplete disclosed pay instead of storing an invented zero', () => {
    const data = { ...draft(), hasSalary: true, max: '3000', currency: 'eur' }
    expect(vacancyImportItemSchema.safeParse(vacancyEditorItem(data, '1')).success).toBe(false)
    expect(vacancyImportItemSchema.parse(vacancyEditorItem({ ...data, min: '0' }, '1')).vacancy.salary?.min).toBe(0)
  })
})
