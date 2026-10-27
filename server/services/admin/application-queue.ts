import { and, eq, exists, gte, lt, ne, notExists, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { schema, useDatabase } from '#server/db'
import { handlingStages } from '#shared/types/application-handling'

export const applicationQueueQuery = z.object({
  status: z.enum(schema.applicationStatusEnum.enumValues).optional(),
  before: z.coerce.number().int().positive().max(2147483647).optional(),
  stage: z.enum(handlingStages).optional(),
  assignee: z.literal('mine').optional(),
  work: z.enum(['active', 'in-progress', 'needs-owner']).optional(),
  receivedFrom: z.iso.datetime({ offset: true }).optional(),
  receivedBefore: z.iso.datetime({ offset: true }).optional(),
  recorded: z.enum(['CONTACTED', 'SHARED']).optional(),
  recordedFrom: z.iso.datetime({ offset: true }).optional(),
  recordedBefore: z.iso.datetime({ offset: true }).optional(),
}).strict().superRefine((value, ctx) => {
  for (const [first, last] of [[value.receivedFrom, value.receivedBefore], [value.recordedFrom, value.recordedBefore]]) {
    if (!first && !last) continue
    const from = Date.parse(first || '')
    const before = Date.parse(last || '')
    if (!Number.isFinite(from) || !Number.isFinite(before) || before <= from || before - from > 90 * 86_400_000) {
      ctx.addIssue({ code: 'custom', message: 'Use both bounds within a positive90-day window' })
    }
  }
  if (Boolean(value.recorded) !== Boolean(value.recordedFrom && value.recordedBefore)) {
    ctx.addIssue({ code: 'custom', message: 'Recorded activity requires an event and both bounds' })
  }
})

export function activeApplicationWork() {
  return and(ne(schema.applications.status, 'WITHDRAWN'), ne(schema.applications.status, 'REJECTED'), ne(schema.applications.handlingStage, 'CLOSED'))!
}

export function applicationNeedsOwner() {
  return notExists(useDatabase().select({ id: schema.users.id }).from(schema.users)
    .where(and(eq(schema.users.id, schema.applications.assignedUserID), eq(schema.users.role, 'ADMIN'))))
}

export function effectiveHandlingEvent() {
  const event = schema.applicationHandlingEvents
  const correction = alias(event, 'metric_correction')
  return notExists(useDatabase().select({ id: correction.id }).from(correction).where(and(
    eq(correction.applicationID, event.applicationID), eq(correction.kind, 'CORRECTED'),
    sql`${correction.data}->>'correctedRevision' = ${event.revision}::text`,
  )))
}

export function applicationQueueConditions(filters: z.infer<typeof applicationQueueQuery>, actorID?: number) {
  const conditions = []
  if (filters.status) conditions.push(eq(schema.applications.status, filters.status))
  if (filters.stage) conditions.push(eq(schema.applications.handlingStage, filters.stage))
  if (filters.work) conditions.push(activeApplicationWork())
  if (filters.work === 'in-progress') conditions.push(ne(schema.applications.handlingStage, 'RECEIVED'))
  if (filters.work === 'needs-owner') conditions.push(applicationNeedsOwner())
  if (filters.assignee === 'mine') {
    if (!actorID) throw createError({ statusCode: 403, statusMessage: 'Current operator required' })
    conditions.push(eq(schema.applications.assignedUserID, actorID))
  }
  if (filters.receivedFrom) conditions.push(gte(schema.applications.createdAt, new Date(filters.receivedFrom)))
  if (filters.receivedBefore) conditions.push(lt(schema.applications.createdAt, new Date(filters.receivedBefore)))
  if (filters.recorded && filters.recordedFrom && filters.recordedBefore) {
    const event = schema.applicationHandlingEvents
    conditions.push(exists(useDatabase().select({ id: event.id }).from(event).where(and(
      eq(event.applicationID, schema.applications.id), eq(event.kind, filters.recorded),
      gte(event.createdAt, new Date(filters.recordedFrom)), lt(event.createdAt, new Date(filters.recordedBefore)), effectiveHandlingEvent(),
    ))))
  }
  return and(...conditions)
}
