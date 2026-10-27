import { sql } from 'drizzle-orm'
import { schema, useDatabase } from '#server/db'

export async function claimBotEntry(botID: string, updateID: number): Promise<boolean> {
  return useDatabase().transaction(async (tx) => {
    await tx.execute(sql`set local lock_timeout='2s'`)
    await tx.execute(sql`set local statement_timeout='3s'`)
    const rows = await tx.insert(schema.botEntryReceipts).values({ botID, updateID })
      .onConflictDoNothing().returning({ updateID: schema.botEntryReceipts.updateID })
    return rows.length === 1
  })
}
