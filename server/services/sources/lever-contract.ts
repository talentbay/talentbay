import { z } from 'zod'
import { vacancyImportItemSchema } from '#server/services/vacancies/import-schema'
import { contactRuleSchema } from './lever-contact'

export const leverSourceSchema = z.object({
  site: z.string().regex(/^[a-z0-9][a-z0-9-]{0,49}$/),
  region: z.enum(['GLOBAL', 'EU']),
  company: vacancyImportItemSchema.shape.company,
  contactRule: contactRuleSchema,
  locations: z.record(z.string().max(500), z.object({
    countryCode: z.string().regex(/^[A-Z]{2}$/), city: z.string().trim().min(1).max(120),
  }).strict()).refine(value => Object.keys(value).length <= 50).default({}),
}).strict()
export type LeverSource = z.infer<typeof leverSourceSchema>

// Inspect lists only for the contact and mobility checks; do not copy source prose.
export const leverPostingSchema = z.object({
  id: z.uuid(), text: z.string().trim().min(2).max(180),
  categories: z.object({
    location: z.string().max(500).nullable().optional(), commitment: z.string().max(100),
    allLocations: z.array(z.string().max(500)).max(200).optional(),
  }),
  country: z.string().regex(/^[a-z]{2}$/i).nullish(),
  workplaceType: z.enum(['on-site', 'hybrid', 'remote', 'unspecified']),
  hostedUrl: z.url().max(2048),
  lists: z.unknown().optional(),
  salaryRange: z.object({
    currency: z.string().regex(/^[a-z]{3}$/i), interval: z.string().max(50),
    min: z.number().int().nonnegative().max(2147483647), max: z.number().int().positive().max(2147483647),
  }).nullable().optional(),
})
export type LeverPosting = z.infer<typeof leverPostingSchema>
export type SourceRecordIssue = { index: number; id: string | null; code: string }

export class SourceFetchError extends Error {
  constructor(readonly code: 'NETWORK' | 'HTTP' | 'RATE_LIMIT' | 'CONTENT_TYPE' | 'BODY_LIMIT' | 'INVALID_JSON' | 'PAGE_LIMIT' | 'DUPLICATE_ID', readonly retryAfterSeconds: number | null = null) {
    super(`Source fetch failed: ${code}`)
    this.name = 'SourceFetchError'
  }
}
