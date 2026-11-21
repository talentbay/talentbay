import { createHash } from 'node:crypto'

export const fixtureMailbox = 'recruiting@example.invalid'
export const contactRule = { section: 'Recruiting contact for this role', mailboxSha256: createHash('sha256').update(fixtureMailbox).digest('hex') }
export const contactSection = { text: contactRule.section, content: `<li>${fixtureMailbox}</li>` }
export const relocationSection = { text: 'Role mobility', content: '<li>Relocation offered</li>' }
export const worldwideSection = { text: 'Role mobility', content: '<li>Worldwide remote without country restrictions</li>' }
