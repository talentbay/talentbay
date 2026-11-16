import { createHash } from 'node:crypto'
import { z } from 'zod'
import { leverSourceSchema } from './lever-contract'

export const approvedSourceSchema = z.object({
  adapter: z.literal('LEVER'),
  config: leverSourceSchema,
  approval: z.object({
    reference: z.string().trim().min(3).max(200),
    contentOwner: z.string().trim().min(2).max(160),
    approvedAt: z.iso.datetime({ offset: true }),
    accessMethod: z.literal('PUBLIC_ATS_API'),
    allowedUse: z.literal('FACTS_ONLY'),
    termsUrl: z.url({ protocol: /^https$/ }).max(2048).refine(value => {
      try {
        const url = new URL(value)
        return !url.username && !url.password
      } catch { return false }
    }, 'Terms URL must not contain credentials'),
  }).strict(),
}).strict()
export type ApprovedSource = z.infer<typeof approvedSourceSchema>
export const sourceKey = (source: ApprovedSource) => `Lever:${source.config.region.toLowerCase()}:${source.config.site}`
export const sourceConfigRevision = (source: ApprovedSource) => createHash('sha256').update(JSON.stringify({ policy: 'facts-only-v1', source: approvedSourceSchema.parse(source) })).digest('hex')

// Adding a board requires a reviewed exact company/site/region and rights reference.
// Never populate this from a request body, an arbitrary URL or a pasted credential.
const approvedSources: ApprovedSource[] = []

export function listApprovedSources() {
  return approvedSources.map(source => ({ key: sourceKey(source), company: source.config.company.name, approval: source.approval }))
}
export function getApprovedSource(key: string): ApprovedSource {
  const source = approvedSources.find(entry => sourceKey(entry) === key)
  if (!source) throw createError({ statusCode: 404, statusMessage: 'No approved source with this key' })
  return approvedSourceSchema.parse(source)
}
