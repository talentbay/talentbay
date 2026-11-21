import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sourceCommandSchema } from '#server/services/sources/commands'
import { approvedSourceSchema, listApprovedSources, sourceConfigRevision } from '#server/services/sources/registry'
import { contactRule } from './lever-contact.fixture'

describe('source operation input and default-off registry', () => {
  it('accepts only fixed source keys and action-specific bounded commands', () => {
    const base = { sourceKey: 'Lever:global:fixture', runID: randomUUID() }
    expect(sourceCommandSchema.safeParse({ ...base, action: 'FETCH' }).success).toBe(true)
    expect(sourceCommandSchema.safeParse({ ...base, action: 'IMPORT', offset: 50, revision: 'a'.repeat(64) }).success).toBe(true)
    for (const input of [
      { ...base, action: 'FETCH', url: 'https://attacker.invalid' },
      { ...base, action: 'FETCH', sourceKey: 'Lever:global:../metadata' },
      { ...base, action: 'PREVIEW', items: [] },
      { ...base, action: 'IMPORT', offset: -1, revision: 'a'.repeat(64) },
      { ...base, action: 'IMPORT', offset: 200, revision: 'a'.repeat(64) },
      { ...base, action: 'IMPORT', offset: 0, revision: 'wrong' },
    ]) expect(sourceCommandSchema.safeParse(input).success).toBe(false)
  })
  it('has no approved live boards and requires a dated approval record', () => {
    expect(listApprovedSources()).toEqual([])
    expect(approvedSourceSchema.safeParse({ adapter: 'LEVER', config: { site: 'fixture', region: 'GLOBAL', company: { name: 'Fictional Company', slug: 'fixture' } } }).success).toBe(false)
  })
  it('requires explicit anonymous ATS access and facts-only reuse, not a generic approval or API availability', () => {
    const input = {
      adapter: 'LEVER', config: { site: 'fixture', region: 'GLOBAL', company: { name: 'Fictional Company', slug: 'fixture' }, contactRule },
      approval: { reference: 'Synthetic permission fixture only', contentOwner: 'Fictional Owner', approvedAt: '2026-11-16T00:00:00Z', accessMethod: 'PUBLIC_ATS_API', allowedUse: 'FACTS_ONLY', termsUrl: 'https://example.com/ats-terms' },
    }
    expect(approvedSourceSchema.safeParse(input).success).toBe(true)
    expect(approvedSourceSchema.safeParse({ ...input, config: { ...input.config, contactRule: undefined } }).success).toBe(false)
    for (const key of ['reference', 'contentOwner', 'approvedAt', 'accessMethod', 'allowedUse', 'termsUrl']) {
      const approval = Object.fromEntries(Object.entries(input.approval).filter(([field]) => field !== key))
      expect(approvedSourceSchema.safeParse({ ...input, approval }).success).toBe(false)
    }
    for (const approval of [
      { ...input.approval, allowedUse: 'FULL_TEXT' },
      { ...input.approval, accessMethod: 'LOGGED_IN_SCRAPING' },
      { ...input.approval, termsUrl: 'https://secret@example.com/terms' },
      { ...input.approval, termsUrl: 'javascript:bad' },
    ]) expect(approvedSourceSchema.safeParse({ ...input, approval }).success).toBe(false)
    const source = approvedSourceSchema.parse(input)
    expect(sourceConfigRevision(source)).not.toBe(sourceConfigRevision({ ...source, approval: { ...source.approval, termsUrl: 'https://example.com/updated-terms' } }))
  })
})
