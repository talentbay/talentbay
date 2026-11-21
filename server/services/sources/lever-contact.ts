import { createHash } from 'node:crypto'
import { z } from 'zod'
import { leverSectionItem } from './lever-section'

export const contactRuleSchema = z.object({
  section: z.string().trim().min(1).max(100),
  mailboxSha256: z.string().regex(/^[0-9a-f]{64}$/),
}).strict()

const mailbox = z.email().max(254)

/** Compare one explicitly labelled list element; never extract contacts from prose or links. */
export function matchesPostingContact(lists: unknown, rule: z.infer<typeof contactRuleSchema>): boolean {
  const address = leverSectionItem(lists, rule.section)
  if (!address || !mailbox.safeParse(address).success) return false
  const at = address.lastIndexOf('@')
  const canonical = address.slice(0, at + 1) + address.slice(at + 1).toLowerCase()
  return createHash('sha256').update(canonical).digest('hex') === rule.mailboxSha256
}
