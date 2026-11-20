import { createHash } from 'node:crypto'
import { z } from 'zod'

export const contactRuleSchema = z.object({
  section: z.string().trim().min(1).max(100),
  mailboxSha256: z.string().regex(/^[0-9a-f]{64}$/),
}).strict()

const mailbox = z.email().max(254)

/** Compare one explicitly labelled list element; never extract contacts from prose or links. */
export function matchesPostingContact(lists: unknown, rule: z.infer<typeof contactRuleSchema>): boolean {
  if (!Array.isArray(lists) || lists.length > 50) return false
  const heading = rule.section.toLowerCase()
  const sections = lists.filter((entry: unknown): entry is { text: string; content?: unknown } =>
    typeof entry === 'object' && entry !== null && 'text' in entry
    && typeof entry.text === 'string' && entry.text.trim().toLowerCase() === heading)
  if (sections.length !== 1) return false
  const content = sections[0]?.content
  if (typeof content !== 'string' || content.length > 300) return false
  const li = content.trim()
  if (!li.startsWith('<li>') || !li.endsWith('</li>')) return false
  const address = li.slice(4, -5).trim()
  if (!mailbox.safeParse(address).success) return false
  const at = address.lastIndexOf('@')
  const canonical = address.slice(0, at + 1) + address.slice(at + 1).toLowerCase()
  return createHash('sha256').update(canonical).digest('hex') === rule.mailboxSha256
}
