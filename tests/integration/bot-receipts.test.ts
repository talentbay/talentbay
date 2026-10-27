import { randomInt } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import postgres from 'postgres'
import { closeDatabase } from '#server/db'
import { claimBotEntry } from '#server/services/bot/receipt'

const sql = postgres(process.env.DATABASE_URL!, { prepare: false })
const botID = String(randomInt(1_000_000_000, 1_000_000_000_000))
afterAll(async () => { await closeDatabase(); await sql`delete from bot_entry_receipts where bot_id=${botID}`; await sql.end() })
describe('prepared-reply receipt on disposable PostgreSQL, not actual delivery', () => {
  it('replays and concurrent deliveries prepare at most one reply without storing PII', async () => {
    expect(await claimBotEntry(botID, 1)).toBe(true)
    const before = await sql`select * from bot_entry_receipts where bot_id=${botID} and update_id=1`
    expect(await claimBotEntry(botID, 1)).toBe(false)
    expect(await sql`select * from bot_entry_receipts where bot_id=${botID} and update_id=1`).toEqual(before)
    const claims = await Promise.all(Array.from({ length: 5 }, () => claimBotEntry(botID, 2)))
    expect(claims.filter(Boolean)).toHaveLength(1)
    expect(Object.keys(before[0]!).sort()).toEqual(['bot_id', 'prepared_at', 'update_id'])
    expect(await claimBotEntry(botID, 0)).toBe(true)
  })
  it('rejects unsafe database keys rather than relying only on HTTP validation', async () => {
    await expect(claimBotEntry(botID, -1)).rejects.toBeDefined()
    await expect(claimBotEntry(botID, Number.MAX_SAFE_INTEGER + 1)).rejects.toBeDefined()
  })
})
