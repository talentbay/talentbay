import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { sourceCommandSchema } from '#server/services/sources/commands'
import { approvedSourceSchema, listApprovedSources } from '#server/services/sources/registry'

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
})
