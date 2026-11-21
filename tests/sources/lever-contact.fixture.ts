import { createHash } from 'node:crypto'

export const fixtureMailbox = 'recruiting@example.invalid'
export const contactRule = { section: 'Recruiting contact for this role', mailboxSha256: createHash('sha256').update(fixtureMailbox).digest('hex') }
export const contactSection = { text: contactRule.section, content: `<li>${fixtureMailbox}</li>` }
