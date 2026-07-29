import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '#server/db/schema'

function createDatabase(connectionString: string) {
  // `prepare: false` keeps the client compatible with transaction-pooling
  // PostgreSQL providers such as Neon.
  const client = postgres(connectionString, { prepare: false })
  return {
    client,
    database: drizzle(client, { schema }),
  }
}

export type Database = ReturnType<typeof createDatabase>['database']

let database: Database | undefined
let databaseClient: ReturnType<typeof createDatabase>['client'] | undefined

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export function useDatabase(): Database {
  if (database) {
    return database
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Database is not configured',
      message: 'DATABASE_URL is not set. Add it to your .env (see .env.example).',
    })
  }

  const connection = createDatabase(connectionString)
  database = connection.database
  databaseClient = connection.client
  return database
}

export async function closeDatabase(): Promise<void> {
  const client = databaseClient
  database = undefined
  databaseClient = undefined

  if (client) {
    await client.end({ timeout: 5 })
  }
}

export { schema }
