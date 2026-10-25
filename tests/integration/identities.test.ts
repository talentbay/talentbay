import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { closeDatabase } from '#server/db'
import { authenticateOAuthUser, authenticateProviderUser, listConnectedIdentities } from '#server/services/auth/oauth-user'
import type { OAuthIdentity, ProviderIdentity } from '#server/services/auth/oauth-user'

const suffix = randomUUID()
const name = `Identity test ${suffix}`
const email = `identity-${suffix}@talentbay.invalid`
const sql = postgres(process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL!, { max: 1, prepare: false })
vi.stubGlobal('createError', (input: object) => Object.assign(new Error('Authentication failed'), input))
let legacyID: number

const google = (id: string, providerEmail = email): OAuthIdentity => ({
  provider: 'GOOGLE', providerAccountID: `${suffix}-${id}`, email: providerEmail,
  emailVerified: true, name,
})
const telegram = (id: string): ProviderIdentity => ({
  provider: 'TELEGRAM', providerAccountID: `${suffix}-${id}`, email: null, name,
})

beforeAll(async () => {
  const [user] = await sql`insert into users (name, email) values (${name}, ${email}) returning id`
  legacyID = user!.id
  await sql`insert into oauth_accounts (user_id, provider, provider_account_id, provider_email) values (${legacyID}, 'GOOGLE', ${`${suffix}-legacy`}, ${email})`
  await sql`insert into candidate_profiles (user_id, headline) values (${legacyID}, 'Keep my existing profile')`
})

afterAll(async () => {
  await closeDatabase()
  await sql`delete from users where name = ${name}`
  await sql.end()
  vi.unstubAllGlobals()
})

describe('permanent local accounts and provider identities', () => {
  it('preserves a legacy provider subject, user ID and profile even if the provider email changes', async () => {
    const user = await authenticateOAuthUser(google('legacy', `changed-${suffix}@talentbay.invalid`))
    expect(user).toMatchObject({ id: legacyID, email, role: 'USER' })
    expect((await sql`select headline from candidate_profiles where user_id = ${legacyID}`)[0]?.headline).toBe('Keep my existing profile')
  })

  it('does not auto-link a new provider subject through matching verified email', async () => {
    await expect(authenticateOAuthUser(google('matching-email'))).rejects.toMatchObject({ statusCode: 409 })
    expect(await sql`select id from oauth_accounts where provider_account_id = ${`${suffix}-matching-email`}`).toHaveLength(0)
  })

  it('creates a Telegram-only user without email and serializes simultaneous first sign-ins', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => authenticateProviderUser(telegram('concurrent'))))
    expect(new Set(results.map(user => user.id)).size).toBe(1)
    expect(results[0]).toMatchObject({ email: null, role: 'USER' })
    expect(await sql`select id from oauth_accounts where provider = 'TELEGRAM' and provider_account_id = ${`${suffix}-concurrent`}`).toHaveLength(1)
  })

  it('links a proven new Telegram identity to the existing account without replacing its profile', async () => {
    const linked = await authenticateProviderUser(telegram('explicit'), legacyID)
    const signedIn = await authenticateProviderUser(telegram('explicit'))
    expect(linked.id).toBe(legacyID)
    expect(signedIn.id).toBe(legacyID)
    expect((await sql`select headline from candidate_profiles where user_id = ${legacyID}`)[0]?.headline).toBe('Keep my existing profile')
  })

  it('does not reassign an existing identity to another account', async () => {
    const owner = await authenticateProviderUser(telegram('owned'))
    await expect(authenticateProviderUser(telegram('owned'), legacyID)).rejects.toMatchObject({ statusCode: 409 })
    expect((await authenticateProviderUser(telegram('owned'))).id).toBe(owner.id)
  })

  it('does not switch or silently connect a new host identity to an existing session', async () => {
    await expect(authenticateProviderUser(telegram('new-host'), undefined, legacyID)).rejects.toMatchObject({ statusCode: 409 })
    const other = await authenticateProviderUser(telegram('other-host'))
    await expect(authenticateProviderUser(telegram('other-host'), undefined, legacyID)).rejects.toMatchObject({ statusCode: 409 })
    expect((await authenticateProviderUser(telegram('other-host'), undefined, other.id)).id).toBe(other.id)
  })

  it('connects a new Google identity to a Telegram-only user after explicit proof', async () => {
    const owner = await authenticateProviderUser(telegram('tg-to-google'))
    const identity = google('tg-to-google', `new-${suffix}@talentbay.invalid`)
    expect((await authenticateOAuthUser(identity, owner.id)).id).toBe(owner.id)
    expect((await authenticateOAuthUser(identity)).id).toBe(owner.id)
    const items = await listConnectedIdentities(owner.id)
    expect(items.map(item => item.provider).sort()).toEqual(['GOOGLE', 'TELEGRAM'])
    expect(items.every(item => !('providerAccountID' in item) && !('tokens' in item))).toBe(true)
  })

  it('requires a verified email for a new OAuth identity', async () => {
    await expect(async () => authenticateOAuthUser({ ...google('unverified'), emailVerified: false })).rejects.toMatchObject({ statusCode: 400 })
  })
})
