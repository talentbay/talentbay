import { describe, expect, it } from 'vitest'
import { applicationCommandSchema } from '#shared/schemas/application-command'

describe('bounded operator command contract', () => {
  const base = { commandKey: 'f12019db-d015-4311-ac00-76e5ab4c7437', expectedRevision: 1 }
  it('accepts explicit commands without accepting employer-status writes', () => {
    expect(applicationCommandSchema.parse({ ...base, action: 'START' }).action).toBe('START')
    for (const input of [{ ...base, action: 'VIEWED' }, { ...base, action: 'START', status: 'VIEWED' }, { ...base, action: 'ASSIGN', assigneeID: 0 }, { ...base, action: 'START', expectedRevision: -1 }, { ...base, action: 'START', commandKey: 'not-a-key' }]) {
      expect(applicationCommandSchema.safeParse(input).success).toBe(false)
    }
  })
  it('requires a bounded reference/time and completed-share acknowledgment', () => {
    const share = { ...base, action: 'SHARE', channel: 'EMAIL', occurredAt: '2026-10-27T12:00:00+03:00', reference: 'Synthetic thread', confirmCompleted: true }
    expect(applicationCommandSchema.safeParse(share).success).toBe(true)
    for (const input of [{ ...share, confirmCompleted: false }, { ...share, occurredAt: 'yesterday' }, { ...share, reference: '' }, { ...share, reference: 'a'.repeat(301) }, { ...share, privateNote: 'a'.repeat(2001) }]) {
      expect(applicationCommandSchema.safeParse(input).success).toBe(false)
    }
  })
  it('requires explicit targets and private reasons for correction/reopening without status or consent writes', () => {
    const correction = { ...base, action: 'CORRECT', targetRevision: 4, reason: 'RECORDED_IN_ERROR', privateNote: 'Wrong event was entered' }
    expect(applicationCommandSchema.safeParse(correction).success).toBe(true)
    expect(applicationCommandSchema.safeParse({ ...base, action: 'REOPEN', privateNote: 'Company returned our contact' }).success).toBe(true)
    for (const input of [{ ...correction, targetRevision: 0 }, { ...correction, reason: 'DELETE_HISTORY' }, { ...correction, privateNote: '    ' }, { ...correction, status: 'NEW' }, { ...base, action: 'REOPEN' }, { ...base, action: 'REOPEN', privateNote: 'A reason', shareAcknowledged: true }]) expect(applicationCommandSchema.safeParse(input).success).toBe(false)
  })
})
