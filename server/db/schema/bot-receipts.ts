import { sql } from 'drizzle-orm'
import { bigint, check, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

// Reply prepared, not proof of Telegram delivery. Never store raw messages/chat IDs.
export const botEntryReceipts = pgTable('bot_entry_receipts', {
  botID: text('bot_id').notNull(),
  updateID: bigint('update_id', { mode: 'number' }).notNull(),
  preparedAt: timestamp('prepared_at', { withTimezone: true, precision: 3 }).notNull().defaultNow(),
}, table => [
  primaryKey({ columns: [table.botID, table.updateID] }),
  check('bot_entry_receipts_bot_bounds', sql`${table.botID} ~ '^[1-9][0-9]{0,15}$'`),
  check('bot_entry_receipts_update_bounds', sql`${table.updateID} between 0 and 9007199254740991`),
])
