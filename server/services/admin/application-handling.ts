import { createHash } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'
import { applicationCommandSchema } from '#shared/schemas/application-command'
import type { ApplicationCommand } from '#shared/schemas/application-command'
import { hasCandidateRequestedClosure, requireCurrentOperator, requireShareableSnapshot } from './application-package'
import type { ApplicationPackage, HandlingEventData, HandlingEventKind, HandlingStage } from '#shared/types/application-handling'

function conflict(message: string): never {
  throw createError({ statusCode: 409, statusMessage: message })
}

export async function prepareApplicationPackage(actorID: number, id: number): Promise<ApplicationPackage> {
  return await useDatabase().transaction(async (tx) => {
    const [application] = await tx.select().from(schema.applications).where(eq(schema.applications.id, id)).for('share')
    if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    await requireCurrentOperator(tx, actorID)
    if (application.assignedUserID !== actorID) conflict('Only the assigned operator can prepare this package')
    if (!['CONTACTED', 'FOLLOW_UP'].includes(application.handlingStage)) conflict('Record company contact before preparing a package')
    const [shared] = await tx.select({ id: schema.applicationHandlingEvents.id }).from(schema.applicationHandlingEvents)
      .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.kind, 'SHARED'))).limit(1)
    if (shared) conflict('A handoff was already recorded; do not send it again')
    const snapshot = await requireShareableSnapshot(tx, application)
    return { applicationID: id, revision: application.handlingRevision, snapshot, coverLetter: application.coverLetter }
  })
}

export async function handleApplication(actorID: number, id: number, input: ApplicationCommand) {
  const command = applicationCommandSchema.parse(input)
  const digest = createHash('sha256').update(JSON.stringify(command)).digest('hex')
  return await useDatabase().transaction(async (tx) => {
    await tx.execute(sql`set local lock_timeout='5s'`)
    await tx.execute(sql`set local statement_timeout='15s'`)
    const [application] = await tx.select().from(schema.applications).where(eq(schema.applications.id, id)).for('update')
    if (!application) throw createError({ statusCode: 404, statusMessage: 'Application not found' })
    await requireCurrentOperator(tx, actorID)
    const [previous] = await tx.select().from(schema.applicationHandlingEvents)
      .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.commandKey, command.commandKey))).limit(1)
    if (previous) {
      if (previous.commandDigest !== digest || previous.actorUserID !== actorID) conflict('This command key was already used for another action')
      return { id, revision: previous.revision, eventID: previous.id, replayed: true }
    }
    if (application.handlingRevision !== command.expectedRevision) conflict('Application changed; reload before recording this action')
    const terminalStatus = application.status === 'WITHDRAWN' || application.status === 'REJECTED'
    if (command.action !== 'CORRECT' && command.action !== 'REOPEN' && (terminalStatus || application.handlingStage === 'CLOSED')) conflict('This application is closed')

    let stage: HandlingStage = application.handlingStage
    let kind: HandlingEventKind
    let assignedUserID = application.assignedUserID
    const data: HandlingEventData = {}
    if (!['ASSIGN', 'CORRECT', 'REOPEN'].includes(command.action) && assignedUserID !== actorID) conflict('Only the assigned operator can record this action')

    switch (command.action) {
      case 'ASSIGN':
        await requireCurrentOperator(tx, command.assigneeID)
        if (assignedUserID === command.assigneeID) conflict('This operator is already assigned')
        assignedUserID = command.assigneeID
        data.assignedUserID = assignedUserID
        kind = 'ASSIGNED'
        break
      case 'START':
        if (stage !== 'RECEIVED') conflict('This application is already being handled')
        stage = 'IN_PROGRESS'
        kind = 'STARTED'
        break
      case 'CONTACT':
        if (!['IN_PROGRESS', 'CONTACTED'].includes(stage)) conflict('Start handling before recording company contact')
        stage = 'CONTACTED'
        kind = 'CONTACTED'
        break
      case 'SHARE': {
        if (!['CONTACTED', 'FOLLOW_UP'].includes(stage)) conflict('Record company contact before sharing')
        const [shared] = await tx.select({ id: schema.applicationHandlingEvents.id }).from(schema.applicationHandlingEvents)
          .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.kind, 'SHARED'))).limit(1)
        if (shared) conflict('A handoff was already recorded; do not send it again')
        await requireShareableSnapshot(tx, application)
        stage = 'SHARED'
        kind = 'SHARED'
        break
      }
      case 'FOLLOW_UP':
        if (!['CONTACTED', 'SHARED', 'FOLLOW_UP'].includes(stage)) conflict('Record company contact before follow-up')
        stage = 'FOLLOW_UP'
        kind = 'FOLLOW_UP'
        break
      case 'CLOSE':
        data.closeReason = command.reason
        stage = 'CLOSED'
        kind = 'CLOSED'
        break
      case 'CORRECT': {
        const [target] = await tx.select({ kind: schema.applicationHandlingEvents.kind }).from(schema.applicationHandlingEvents)
          .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.revision, command.targetRevision))).limit(1)
        if (!target || !['CONTACTED', 'SHARED', 'FOLLOW_UP', 'CLOSED'].includes(target.kind)) conflict('Select a correctable operator entry from this application')
        const [corrected] = await tx.select({ id: schema.applicationHandlingEvents.id }).from(schema.applicationHandlingEvents)
          .where(and(eq(schema.applicationHandlingEvents.applicationID, id), eq(schema.applicationHandlingEvents.kind, 'CORRECTED'), sql`${schema.applicationHandlingEvents.data}->>'correctedRevision' = ${String(command.targetRevision)}`)).limit(1)
        if (corrected) conflict('A correction already exists for this entry')
        data.correctedRevision = command.targetRevision
        data.correctionReason = command.reason
        if (terminalStatus) stage = 'CLOSED'
        else if (stage !== 'CLOSED') stage = 'IN_PROGRESS'
        kind = 'CORRECTED'
        break
      }
      case 'REOPEN':
        if (terminalStatus || stage !== 'CLOSED') conflict('Only closed TalentBay handling without withdrawal or rejection can be reopened')
        if (await hasCandidateRequestedClosure(tx, id)) conflict('Candidate-requested closure needs renewed permission; reopening is not available')
        assignedUserID = actorID
        data.assignedUserID = actorID
        stage = 'IN_PROGRESS'
        kind = 'REOPENED'
        break
    }
    if (command.action === 'CONTACT' || command.action === 'SHARE') {
      const occurredAt = new Date(command.occurredAt)
      if (occurredAt < application.createdAt || occurredAt.getTime() > Date.now() + 60_000) {
        throw createError({ statusCode: 400, statusMessage: 'Use an actual contact time after the application was received' })
      }
      data.channel = command.channel
      data.occurredAt = occurredAt.toISOString()
      data.reference = command.reference
    }
    const revision = application.handlingRevision + 1
    await tx.update(schema.applications).set({ handlingStage: stage, handlingRevision: revision, assignedUserID }).where(eq(schema.applications.id, id))
    const [event] = await tx.insert(schema.applicationHandlingEvents).values({
      applicationID: id, revision, kind, stage, actorUserID: actorID,
      commandKey: command.commandKey, commandDigest: digest, data, privateNote: command.privateNote || null,
    }).returning({ id: schema.applicationHandlingEvents.id })
    return { id, revision, eventID: event!.id, replayed: false }
  })
}
