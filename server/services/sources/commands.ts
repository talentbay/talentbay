import { z } from 'zod'

const key = z.string().regex(/^Lever:(global|eu):[a-z0-9][a-z0-9-]{0,49}$/)
export const sourceQuerySchema = z.object({ sourceKey: key }).strict()
const base = { sourceKey: key, runID: z.uuid() }
export const sourceCommandSchema = z.discriminatedUnion('action', [
  z.object({ ...base, action: z.literal('FETCH') }).strict(),
  z.object({ ...base, action: z.literal('PREVIEW') }).strict(),
  z.object({ ...base, action: z.literal('IMPORT'), offset: z.number().int().min(0).max(199), revision: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
])
