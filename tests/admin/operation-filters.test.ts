import { describe, expect, it } from 'vitest'
import { dashboardQuery } from '#server/services/admin/dashboard'
import { applicationQueueQuery } from '#server/services/admin/application-queue'

describe('bounded operational filters', () => {
  it('allows only the three declared periods and defaults to30 days', () => {
    expect(dashboardQuery.parse({})).toEqual({ days: '30' })
    for (const days of ['7', '30', '90']) expect(dashboardQuery.safeParse({ days }).success).toBe(true)
    for (const value of [{ days: '365' }, { days: ['7', '30'] }, { actorID: 42 }, { days: 7 }]) expect(dashboardQuery.safeParse(value).success).toBe(false)
  })
  it('validates paired half-open windows and does not accept unbounded history filters', () => {
    const bounds = { receivedFrom: '2026-07-01T00:00:00Z', receivedBefore: '2026-09-29T00:00:00Z' }
    expect(applicationQueueQuery.safeParse(bounds).success).toBe(true)
    for (const value of [
      { receivedFrom: bounds.receivedFrom }, { receivedBefore: bounds.receivedBefore },
      { ...bounds, receivedBefore: bounds.receivedFrom }, { ...bounds, receivedBefore: '2026-09-30T00:00:00Z' },
      { ...bounds, receivedFrom: 'not-a-date' }, { recorded: 'SHARED' }, { recordedFrom: bounds.receivedFrom, recordedBefore: bounds.receivedBefore },
    ]) expect(applicationQueueQuery.safeParse(value).success).toBe(false)
    expect(applicationQueueQuery.safeParse({ recorded: 'CONTACTED', recordedFrom: bounds.receivedFrom, recordedBefore: bounds.receivedBefore }).success).toBe(true)
  })
  it('preserves existing page filters without arbitrary operator or query keys', () => {
    expect(applicationQueueQuery.parse({ stage: 'RECEIVED', before: '25', assignee: 'mine', work: 'active' })).toMatchObject({ before: 25 })
    for (const value of [{ assignee: 'someone' }, { actorID: 42 }, { work: 'all' }, { before: ['25', '26'] }, { before: 2147483648 }, { recorded: 'CORRECTED' }]) expect(applicationQueueQuery.safeParse(value).success).toBe(false)
  })
})
