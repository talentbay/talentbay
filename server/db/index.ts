import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '#server/db/schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it to your .env (see .env.example).')
}

// Single postgres client reused across requests (serverless-friendly).
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })
export { schema }
