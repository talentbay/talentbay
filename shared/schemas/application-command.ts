import { z } from 'zod'
import { handlingCloseReasons, handlingCorrectionReasons } from '../types/application-handling'

const base = z.object({
  expectedRevision: z.number().int().nonnegative().max(2147483646),
  commandKey: z.uuid(),
  privateNote: z.string().trim().max(2_000).optional(),
})
const contact = {
  channel: z.enum(['EMAIL', 'PHONE', 'PLATFORM', 'OTHER']),
  occurredAt: z.iso.datetime({ offset: true }),
  reference: z.string().trim().min(1).max(300),
}
export const applicationCommandSchema = z.discriminatedUnion('action', [
  base.extend({ action: z.literal('ASSIGN'), assigneeID: z.number().int().positive().max(2147483647) }).strict(),
  base.extend({ action: z.literal('START') }).strict(),
  base.extend({ action: z.literal('CONTACT'), ...contact }).strict(),
  base.extend({ action: z.literal('SHARE'), ...contact, confirmCompleted: z.literal(true) }).strict(),
  base.extend({ action: z.literal('FOLLOW_UP') }).strict(),
  base.extend({ action: z.literal('CLOSE'), reason: z.enum(handlingCloseReasons) }).strict(),
  base.extend({ action: z.literal('CORRECT'), targetRevision: z.number().int().positive().max(2147483646), reason: z.enum(handlingCorrectionReasons), privateNote: z.string().trim().min(5).max(2000) }).strict(),
  base.extend({ action: z.literal('REOPEN'), privateNote: z.string().trim().min(5).max(2000) }).strict(),
])
export type ApplicationCommand = z.infer<typeof applicationCommandSchema>
